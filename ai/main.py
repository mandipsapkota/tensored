from fastapi import FastAPI, Query
from dotenv import load_dotenv
import os,json
from utils.respond_canvas import respond_canvas
from utils.get_quiz_response import get_quiz_response
from fastapi.middleware.cors import CORSMiddleware
from utils.generate_quiz import generate_quiz_util


# Load environment variables
load_dotenv()

# Initialize the app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your specific domain
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to your FastAPI app!"}

# GENERATE VIDEO
@app.get("/video/{prompt}")
def generate_video(prompt: str, W: int = 680, H: int = 400):
    """Generate video from prompt with custom canvas dimensions
    
    Args:
        prompt: Video content prompt
        W: Canvas width (default: 680)
        H: Canvas height (default: 400)
    """
    openai_api_key = os.getenv("OPENAI_API_KEY")
    response = respond_canvas(APIKEY=openai_api_key, PROMPT=prompt, W=W, H=H)
    return response

# GENERATE TEXT 

# GENERATE QUIZ 
@app.post("/quiz/generate", tags=["quiz"])
def generate_quiz(
    conversation_history: str = Query(..., description="JSON string of conversation history"),
    topic: str = Query(..., description="Topic name")
):
    return generate_quiz_util(conversation_history, topic)

# POST QUIZ RESPONSE
@app.post("/quiz/feedback", tags=["quiz"])
def quiz_feedback(
    user_response: str = Query(..., description="JSON string of quiz answers"),
    topic: str = Query(..., description="Topic name")
):
    """
    Generate a quiz analysis report from quiz_response and topic of the concept.
    """
    response = get_quiz_response(user_response, topic)
    return {"feedback": response}