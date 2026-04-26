from openai import OpenAI
import json, os, base64, re
from io import BytesIO
from dotenv import load_dotenv
from typing import List, Dict, Any

load_dotenv()

# Global client - will be initialized per request
client = None

# ---------------------------------------------------------------------------
# AGENT 1 - Planner
# Returns structured scene plan with narration + drawing instructions
# ---------------------------------------------------------------------------
PLANNER_PROMPT = """You are an animation director creating educational explainer videos.

Given a topic, return ONLY a JSON object like this:

{
  "title": "How Photosynthesis Works",
  "scenes": [
    {
      "order": 1,
      "duration": 6,
      "text": "Plants capture sunlight using chlorophyll in their leaves.",
      "draw_instructions": "Draw a large green leaf shape in the center. Show sunlight rays (yellow lines) coming from the top-left hitting the leaf. Add the label 'Chlorophyll' inside the leaf. Animate the sun rays growing in from top-left over the first half of the scene."
    }
  ]
}

RULES:
- Plan the concept into required number of scenes (minimum 15) to explain a topic properly. 
- Each scene duration: 5 to 7 seconds as required by the input.
- narration: 1-2 clear, friendly sentences spoken during the scene
- draw_instructions: be VERY specific about what to draw, where, what colors, what labels, and how it animates using the 'progress' variable (0 to 1). Think visually. Reference specific positions like 'center', 'top-left', 'right side'. Mention exact colors. Describe motion clearly.
- Consider color contrast and design sense.
- Make scenes build on each other visually to tell a story. It should properly explain the concept to someone. 
- Return ONLY the JSON, no markdown, no explanation
"""
def plan_scenes(topic: str) -> dict:
    resp = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=2000,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": PLANNER_PROMPT},
            {"role": "user", "content": f"Topic: {topic}"}
        ]
    )
    return json.loads(resp.choices[0].message.content)

# ---------------------------------------------------------------------------
# AGENT 2 - Canvas Code Generator
# Generates actual JS canvas drawing code for each scene
# ---------------------------------------------------------------------------
# CANVAS_PROMPT = """You are an expert HTML Canvas 2D animator.

# Write the JavaScript body of this function:
#   function drawScene(ctx, W, H, progress) { YOUR CODE HERE }

# Variables:
# - ctx: CanvasRenderingContext2D
# - W: canvas width (680)
# - H: canvas height (400)  
# - progress: 0.0 to 1.0 (how far through the scene we are)

# STRICT RULES:
# 1. Return ONLY raw JS code. No function wrapper. No backticks. No markdown. No comments.
# 2. Do NOT call ctx.clearRect (already done before your code runs)
# 3. No fetch, eval, document, window, or DOM access
# 4. All positions must use W and H (e.g. W*0.5 for center-x)
# 5. Use progress for ALL animations (e.g. opacity = progress, x = W * 0.1 + progress * W * 0.4)
# 6. Draw backgrounds with ctx.fillRect(0,0,W,H) first
# 7. Use ctx.save() / ctx.restore() around transformed elements
# 8. For text: always set ctx.textAlign and ctx.textBaseline before ctx.fillText
# 9. Make it VISUALLY RICH: gradients, glows (shadowBlur), smooth curves, multiple elements
# 10. Easing: use eased = t < 0.5 ? 2*t*t : -1+(4-2*t)*t where t = progress

# Draw instructions for this scene:
# """

def generate_canvas_code(scene: dict, previous_error: str = None, canvas_width: int = 680, canvas_height: int = 400) -> str:
    instructions = scene["draw_instructions"]
    extra = ""
    if previous_error:
        extra = f"\n\nFix this error from last attempt: {previous_error}\n"
    
    # Create dynamic prompt with actual canvas dimensions
    canvas_prompt = f"""You are an expert HTML Canvas 2D animator.

Write the JavaScript body of this function:
  function drawScene(ctx, W, H, progress) {{ YOUR CODE HERE }}

Variables:
- ctx: CanvasRenderingContext2D
- W: canvas width ({canvas_width})
- H: canvas height ({canvas_height})  
- progress: 0.0 to 1.0 (how far through the scene we are)

STRICT RULES:
1. Return ONLY raw JS code. No function wrapper. No backticks. No markdown. No comments.
2. Do NOT call ctx.clearRect (already done before your code runs)
3. No fetch, eval, document, window, or DOM access
4. All positions must use W and H (e.g. W*0.5 for center-x)
5. Use progress for ALL animations (e.g. opacity = progress, x = W * 0.1 + progress * W * 0.4)
6. Draw backgrounds with ctx.fillRect(0,0,W,H) first
7. Use ctx.save() / ctx.restore() around transformed elements
8. For text: always set ctx.textAlign and ctx.textBaseline before ctx.fillText
9. Make it VISUALLY RICH: gradients, glows (shadowBlur), smooth curves, multiple elements
10. Easing: use eased = t < 0.5 ? 2*t*t : -1+(4-2*t)*t where t = progress
11. Use relevant animations. Try to make animations as relevant to reallife as possible. 

Draw instructions for this scene:
"""
    
    resp = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=1500,
        temperature=0.3,
        messages=[
            {"role": "system", "content": canvas_prompt + instructions + extra},
            {"role": "user", "content": "Write the canvas drawing code now."}
        ]
    )
    code = resp.choices[0].message.content
    code = re.sub(r"```(?:javascript|js)?", "", code).strip().rstrip("`").strip()
    return code


# ---------------------------------------------------------------------------
# AGENT 3 - Code Validator
# ---------------------------------------------------------------------------
VALIDATOR_PROMPT = """You are a JavaScript Canvas 2D code reviewer.

The code runs as the body of: function drawScene(ctx, W, H, progress) { ... }
Available: ctx (CanvasRenderingContext2D), W (number), H (number), progress (0-1 float).
Math, console, and standard JS globals are available.

Check ONLY for:
1. Syntax errors
2. Undefined variables (anything that is not ctx, progress, W, H, Math, console, or declared locally).
3. Forbidden: fetch, eval, document, window, XMLHttpRequest
4. Obviously broken canvas calls

Respond ONLY with:
VALID
or
ERROR: <one line description>
"""

def validate_code(code: str) -> tuple:
    resp = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=100,
        temperature=0,
        messages=[
            {"role": "system", "content": VALIDATOR_PROMPT},
            {"role": "user", "content": f"```javascript\n{code}\n```"}
        ]
    )
    result = resp.choices[0].message.content.strip()
    if result.startswith("VALID"):
        return True, None
    return False, result.removeprefix("ERROR:").strip()


# ---------------------------------------------------------------------------
# MAIN ORCHESTRATOR - respond_canvas
# Takes user prompt + API key and returns formatted video scenes
# ---------------------------------------------------------------------------
def respond_canvas(APIKEY: str, PROMPT: str, W: int = 680, H: int = 400) -> List[Dict[str, Any]]:
    """
    Main workflow function that orchestrates the video generation pipeline.
    
    Args:
        APIKEY: OpenAI API key
        PROMPT: User prompt describing the video content
        W: Canvas width (default: 680)
        H: Canvas height (default: 400)
        
    Returns:
        List of scene dictionaries with format:
        [
            {
                "order": int,
                "duration": int,
                "canvas_code": str,
                "text": str
            },
            ...
        ]
    """
    global client
    
    # Initialize OpenAI client with provided API key
    client = OpenAI(api_key=APIKEY)
    
    try:
        # Step 1: Plan scenes from user prompt
        print(f"Planning scenes for prompt: {PROMPT}")
        plan = plan_scenes(PROMPT)
        scenes = plan.get("scenes", [])
        
        if not scenes:
            raise ValueError("No scenes generated from prompt")
        
        # Step 2: Generate and validate canvas code for each scene
        response_scenes = []
        for scene in scenes:
            print(f"Processing scene {scene['order']}: {scene['text'][:50]}...")
            
            # Generate canvas code with retry logic
            canvas_code = None
            max_retries = 3
            last_error = None
            
            for attempt in range(max_retries):
                generated_code = generate_canvas_code(scene, previous_error=last_error, canvas_width=W, canvas_height=H)
                
                # Validate the generated code
                is_valid, error = validate_code(generated_code)
                
                if is_valid:
                    canvas_code = generated_code
                    print(f"  ✓ Canvas code generated successfully")
                    break
                else:
                    last_error = error
                    print(f"  ✗ Validation failed (attempt {attempt + 1}/{max_retries}): {error}")
            
            if canvas_code is None:
                print(f"  ⚠ Using unvalidated code for scene {scene['order']}")
                canvas_code = generate_canvas_code(scene, canvas_width=W, canvas_height=H)
            
            # Build response scene object
            response_scene = {
                "order": int(scene["order"]),
                "duration": int(scene["duration"]),
                "canvas_code": canvas_code,
                "text": scene["text"]
            }
            response_scenes.append(response_scene)
        
        print(f"✓ Successfully generated {len(response_scenes)} scenes")
        return response_scenes
        
    except Exception as e:
        print(f"✗ Error in respond_canvas: {str(e)}")
        raise