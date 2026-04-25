from fastapi import FastAPI
from dotenv import load_dotenv
import os
from utils.respond_canvas import respond_canvas
from fastapi.middleware.cors import CORSMiddleware

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

