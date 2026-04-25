import openai
import json
import os
from dotenv import load_dotenv

load_dotenv()

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_quiz_util(conversation_history, topic: str):
    """
    Generate quiz questions based on conversation history and topic.
    
    Args:
        conversation_history: List of dicts with 'user_prompt' and 'backend_response' keys
        topic: Topic name for the quiz
    
    Returns:
        List of quiz question dicts with keys: 'question', 'options', 'correct'
    """
    # Prepare conversation summary
    
    
    prompt = f"""Generate 4 quiz questions about {topic} based on this conversation:

{conversation_history}

Requirements:
- Each question must test understanding of key concepts discussed
- Provide 4 multiple-choice options (1, 2, 3, 4)
- Mark the correct answer

Return ONLY valid JSON in this format:
[
  {{
    "question": "What is...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 1
  }}
]"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1000
    )
    
    quizzes = response.choices[0].message.content.strip()
    
    # Clean and parse JSON
    if quizzes.startswith("```json"):
        quizzes = quizzes.split("```json")[1].split("```")[0]
    elif quizzes.startswith("```"):
        quizzes = quizzes.split("```")[1].split("```")[0]
    
    return json.loads(quizzes)