from pydantic import BaseModel, Field
from typing import List


class CanvasResponse(BaseModel):
    """Canvas response schema for video scenes"""
    order: int = Field(..., description="Scene order/sequence number", ge=1)
    canvas_code: str = Field(..., description="Canvas JavaScript code for rendering")
    text: str = Field(..., description="Script/text narration for the scene")
    duration: float = Field(..., description="Scene duration in seconds", gt=0)


class CanvasResponseDict(BaseModel):
    """List of canvas response objects"""
    scenes: List[CanvasResponse] = Field(
        ..., 
        description="List of scenes in order",
        example=[
            {
                "order": 1,
                "canvas_code": "ctx.fillStyle = 'blue'; ctx.fillRect(0, 0, 800, 600);",
                "text": "Welcome to the video",
                "duration": 5.0
            },
            {
                "order": 2,
                "canvas_code": "ctx.fillStyle = 'red'; ctx.fillRect(100, 100, 200, 200);",
                "text": "Here are the details",
                "duration": 8.0
            }
        ]
    )