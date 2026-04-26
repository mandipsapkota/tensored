from openai import OpenAI
import json
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ---------------------------------------------------------------------------
# QUIZ GENERATOR PROMPT
# ---------------------------------------------------------------------------
QUIZ_GENERATOR_PROMPT = """Generate 4 quiz questions based on the provided topic and conversation.

Requirements:
- Each question must test understanding of key concepts
- Provide exactly 4 multiple-choice options
- Mark the correct answer as an integer (1, 2, 3, or 4) representing the option index
- Ensure questions are clear, unambiguous, and educational
- Questions should vary in difficulty

Return ONLY valid JSON in this exact format:
[
  {{
    "question": "What is...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 1
  }},
  {{
    "question": "How does...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 2
  }}
]"""

# ---------------------------------------------------------------------------
# VALIDATOR AGENT PROMPT
# ---------------------------------------------------------------------------
VALIDATOR_PROMPT = """You are a quiz quality validator.

Validate the following quiz questions. Check for:
1. Exactly 4 questions in valid JSON format
2. Each question has: "question" (non-empty string), "options" (4-item array), "correct" (1-4 integer)
3. All options are non-empty strings
4. Correct answer index is valid (1-4)
5. Questions are clear and unambiguous
6. Options are plausible and similar in length
7. Exactly one correct answer per question

Respond ONLY with:
VALID
or
INVALID: <brief reason>
"""

def generate_quiz_questions(conversation_history, topic: str) -> list:
    """Generate quiz questions using GPT-5.5."""
    prompt = f"""Generate 4 quiz questions about {topic} based on this conversation:

{conversation_history}

{QUIZ_GENERATOR_PROMPT}"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_completion_tokens=1000
    )
    
    quizzes = response.choices[0].message.content.strip()
    
    # Clean and parse JSON
    if quizzes.startswith("```json"):
        quizzes = quizzes.split("```json")[1].split("```")[0]
    elif quizzes.startswith("```"):
        quizzes = quizzes.split("```")[1].split("```")[0]
    
    return json.loads(quizzes)


def validate_quiz(quiz_questions: list) -> tuple:
    """
    Validate quiz questions format and quality.
    
    Returns:
        (is_valid: bool, error_message: str or None)
    """
    # First, basic format validation
    if not isinstance(quiz_questions, list):
        return False, "Response is not a list"
    
    if len(quiz_questions) != 4:
        return False, f"Expected 4 questions, got {len(quiz_questions)}"
    
    for i, q in enumerate(quiz_questions):
        if not isinstance(q, dict):
            return False, f"Question {i+1} is not a dict"
        
        if "question" not in q or not isinstance(q["question"], str) or not q["question"].strip():
            return False, f"Question {i+1} missing or invalid 'question' field"
        
        if "options" not in q or not isinstance(q["options"], list) or len(q["options"]) != 4:
            return False, f"Question {i+1} must have exactly 4 options"
        
        for j, opt in enumerate(q["options"]):
            if not isinstance(opt, str) or not opt.strip():
                return False, f"Question {i+1}, option {j+1} is empty or not a string"
        
        if "correct" not in q or not isinstance(q["correct"], int):
            return False, f"Question {i+1} missing or invalid 'correct' field"
        
        if q["correct"] < 1 or q["correct"] > 4:
            return False, f"Question {i+1} 'correct' must be 1-4, got {q['correct']}"
    
    # LLM-based validation for content quality
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            max_completion_tokens=100,
            temperature=0,
            messages=[
                {"role": "system", "content": VALIDATOR_PROMPT},
                {"role": "user", "content": f"```json\n{json.dumps(quiz_questions)}\n```"}
            ]
        )
        
        result = resp.choices[0].message.content.strip()
        if result.startswith("VALID"):
            return True, None
        return False, result.removeprefix("INVALID:").strip()
    
    except Exception as e:
        return False, f"Validation error: {str(e)}"


def generate_quiz_util(conversation_history, topic: str, max_retries: int = 3):
    """
    Generate and validate quiz questions with retry logic.
    
    Args:
        conversation_history: List of dicts with conversation data
        topic: Topic name for the quiz
        max_retries: Maximum number of generation attempts (default: 3)
    
    Returns:
        List of validated quiz question dicts
        
    Raises:
        ValueError: If validation fails after max_retries attempts
    """
    last_error = None
    
    for attempt in range(max_retries):
        try:
            print(f"Generating quiz (attempt {attempt + 1}/{max_retries})...")
            
            # Generate quiz questions
            quiz_questions = generate_quiz_questions(conversation_history, topic)
            
            # Validate quiz questions
            is_valid, error = validate_quiz(quiz_questions)
            
            if is_valid:
                print(f"✓ Quiz validated successfully on attempt {attempt + 1}")
                return quiz_questions
            else:
                last_error = error
                print(f"✗ Validation failed (attempt {attempt + 1}/{max_retries}): {error}")
                
                if attempt < max_retries - 1:
                    print("  Regenerating...")
        
        except json.JSONDecodeError as e:
            last_error = f"JSON parsing error: {str(e)}"
            print(f"✗ JSON parsing error (attempt {attempt + 1}/{max_retries}): {last_error}")
        except Exception as e:
            last_error = str(e)
            print(f"✗ Error (attempt {attempt + 1}/{max_retries}): {last_error}")
    
    # All retries failed
    raise ValueError(f"Failed to generate valid quiz after {max_retries} attempts. Last error: {last_error}")