def respond_canvas(APIKEY, PROMPT):
    return {
        "canvas": [
            {
                "order": 1,
                "canvas_code": "ctx.fillStyle = 'blue'; ctx.fillRect(0, 0, 800, 600);",
                "text": f"Welcome to the video: {PROMPT}",
                "duration": 5.0
            },
            {
                "order": 2,
                "canvas_code": "ctx.fillStyle = 'red'; ctx.fillRect(100, 100, 200, 200);",
                "text": "Here are the details",
                "duration": 8.0
            }
        ],
        "metadata": {
            "api_key_used": bool(APIKEY),
            "prompt": PROMPT
        }
    }