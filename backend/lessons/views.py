import urllib.parse
import requests
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Session
from .serializers import SessionSerializer

AI_SERVICE_URL = "http://localhost:8001/video/"

class SessionListCreateView(generics.ListCreateAPIView):
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Session.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        title = request.data.get('title')
        description = request.data.get('description')

        if not title or not description:
            return Response({"error": "Title and description are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Build prompt and call FastAPI
        prompt = f"Title: {title}\nDescription: {description}"
        encoded_prompt = urllib.parse.quote(prompt)
        
        try:
            ai_response = requests.get(f"{AI_SERVICE_URL}{encoded_prompt}", timeout=120)
            ai_response.raise_for_status()
            ai_data = ai_response.json()
            if isinstance(ai_data, dict):
                scenes = ai_data.get("scenes", [])
            elif isinstance(ai_data, list):
                scenes = ai_data
            else:
                scenes = []
            
            # Use history format
            animation_data = {
                "history": [
                    {
                        "prompt": prompt,
                        "scenes": scenes
                    }
                ]
            }
        except requests.exceptions.RequestException as e:
            return Response({"error": f"Failed to generate animation from AI service: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)

        # Save to DB
        session = Session.objects.create(
            user=request.user,
            title=title,
            description=description,
            animation_data=animation_data
        )

        serializer = self.get_serializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class SessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Session.objects.filter(user=self.request.user)

    def partial_update(self, request, *args, **kwargs):
        session = self.get_object()
        new_prompt = request.data.get('prompt')
        
        if new_prompt:
            encoded_prompt = urllib.parse.quote(new_prompt)
            try:
                ai_response = requests.get(f"{AI_SERVICE_URL}{encoded_prompt}", timeout=120)
                ai_response.raise_for_status()
                new_animation_data = ai_response.json()
                
                if isinstance(new_animation_data, dict):
                    new_scenes = new_animation_data.get("scenes", [])
                elif isinstance(new_animation_data, list):
                    new_scenes = new_animation_data
                else:
                    new_scenes = []
            except requests.exceptions.RequestException as e:
                return Response({"error": f"Failed to generate animation from AI service: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)

            # Safely migrate legacy formats to history list format
            if isinstance(session.animation_data, list):
                session.animation_data = {
                    "history": [
                        {
                            "prompt": "Initial session prompt",
                            "scenes": session.animation_data
                        }
                    ]
                }
            elif isinstance(session.animation_data, dict):
                if "history" not in session.animation_data:
                    session.animation_data = {
                        "history": [
                            {
                                "prompt": "Initial session prompt",
                                "scenes": session.animation_data.get("scenes", [])
                            }
                        ]
                    }
            else:
                session.animation_data = {"history": []}
                
            # Append the new prompt and its independent scenes to the history
            session.animation_data["history"].append({
                "prompt": new_prompt,
                "scenes": new_scenes
            })
                
            session.description = (session.description or "") + f"\n\nFollow-up: {new_prompt}"
            session.save()
            
        serializer = self.get_serializer(session)
        return Response(serializer.data)
