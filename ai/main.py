from fastapi import FastAPI, HTTPException, Header
from utils.respond_canvas import respond_canvas

# Initialize the app
app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to your FastAPI app!"}

@app.get("/video/{prompt}")
def generate_video(prompt: str, x_api_key: str = Header(None)):
    """Generate video from prompt with API key validation"""
    if not x_api_key:
        raise HTTPException(
            status_code=401, 
            detail="API key is required. Please provide 'x-api-key' header."
        )
    
    response = respond_canvas(x_api_key, prompt)
    return response