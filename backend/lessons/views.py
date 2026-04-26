import urllib.parse
import json
import requests
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import Session
from .serializers import SessionSerializer
from chat.models import ChatExchange

AI_SERVICE_URL = "http://localhost:8001"
AI_TEXT_SERVICE_URL = "http://localhost:8001/response/generate"
AI_QUIZ_SERVICE_URL = "http://localhost:8001/quiz/generate"
AI_QUIZ_FEEDBACK_SERVICE_URL = "http://localhost:8001/quiz/feedback"


def normalize_mode(value):
    mode = (value or "animate").strip().lower()
    return mode if mode in ("animate", "text") else "animate"


def extract_chat_exchange_history(session):
    exchanges = ChatExchange.objects.filter(session=session).order_by('created_at')
    return [
        {
            "user_prompt": item.user_prompt,
            "backend_response": item.backend_response,
        }
        for item in exchanges
    ]


def extract_text_entries(history):
    entries = []
    for item in history:
        if item.get("mode") == "text":
            prompt = item.get("prompt", "")
            response = item.get("response", "")
            if prompt:
                entries.append({"role": "user", "content": prompt})
            if response:
                entries.append({"role": "assistant", "content": response})
    return entries


def call_animation_service(prompt, conversation_history=None, session_topic=""):
    encoded_prompt = urllib.parse.quote(prompt)
    params = {
        "conversation_history": json.dumps(conversation_history or []),
        "sessionTopic": session_topic,
    }
    ai_response = requests.get(f"{AI_SERVICE_URL}/video/{encoded_prompt}", params=params, timeout=300)
    ai_response.raise_for_status()
    ai_data = ai_response.json()

    if isinstance(ai_data, dict):
        return ai_data.get("scenes", [])
    if isinstance(ai_data, list):
        return ai_data
    return []


def call_text_service(topic, user_message, conversation_history):
    params = {
        "conversation_history": json.dumps(conversation_history),
        "user_message": user_message,
        "topic": topic,
    }
    ai_response = requests.post(AI_TEXT_SERVICE_URL, params=params, timeout=300)
    ai_response.raise_for_status()
    ai_data = ai_response.json()

    if isinstance(ai_data, str):
        return ai_data
    if isinstance(ai_data, dict):
        return ai_data.get("response") or ai_data.get("message") or str(ai_data)
    return str(ai_data)


def ensure_history_format(session):
    if isinstance(session.animation_data, list):
        session.animation_data = {
            "history": [
                {
                    "mode": "animate",
                    "prompt": "Initial session prompt",
                    "scenes": session.animation_data,
                }
            ],
            "default_mode": "animate",
        }
        return

    if isinstance(session.animation_data, dict):
        if "history" not in session.animation_data:
            session.animation_data = {
                "history": [
                    {
                        "mode": "animate",
                        "prompt": "Initial session prompt",
                        "scenes": session.animation_data.get("scenes", []),
                    }
                ],
                "default_mode": "animate",
            }
            return

        session.animation_data.setdefault("default_mode", "animate")
        for item in session.animation_data.get("history", []):
            if "mode" not in item:
                item["mode"] = "animate" if item.get("scenes") else "text"
        return

    session.animation_data = {"history": [], "default_mode": "animate"}

class SessionListCreateView(generics.ListCreateAPIView):
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Session.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        title = request.data.get('title')
        description = request.data.get('description')
        mode = normalize_mode(request.data.get('mode'))

        if not title or not description:
            return Response({"error": "Title and description are required."}, status=status.HTTP_400_BAD_REQUEST)

        prompt = f"Title: {title}\nDescription: {description}"

        try:
            if mode == "text":
                text_response = call_text_service(
                    topic=title,
                    user_message=description,
                    conversation_history=[],
                )
                history_entry = {
                    "mode": "text",
                    "prompt": prompt,
                    "response": text_response,
                }
            else:
                scenes = call_animation_service(prompt, conversation_history=[], session_topic=title)
                history_entry = {
                    "mode": "animate",
                    "prompt": prompt,
                    "scenes": scenes,
                }

            animation_data = {
                "history": [history_entry],
                "default_mode": mode,
            }
        except requests.exceptions.RequestException as e:
            return Response({"error": f"Failed to generate lesson from AI service: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)

        # Save to DB
        session = Session.objects.create(
            user=request.user,
            title=title,
            description=description,
            animation_data=animation_data
        )

        ChatExchange.objects.create(
            session=session,
            mode=mode,
            user_prompt=prompt,
            backend_response=text_response if mode == "text" else f"Generated animation with {len(history_entry.get('scenes', []))} scenes.",
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
        mode = normalize_mode(request.data.get('mode'))
        
        if new_prompt:
            try:
                ensure_history_format(session)
                history = session.animation_data.get("history", [])

                if mode == "text":
                    conversation_history = extract_text_entries(history)
                    text_response = call_text_service(
                        topic=session.title,
                        user_message=new_prompt,
                        conversation_history=conversation_history,
                    )
                    history.append({
                        "mode": "text",
                        "prompt": new_prompt,
                        "response": text_response,
                    })
                    backend_response = text_response
                else:
                    chat_history = extract_chat_exchange_history(session)
                    new_scenes = call_animation_service(
                        new_prompt,
                        conversation_history=chat_history,
                        session_topic=session.title,
                    )
                    history.append({
                        "mode": "animate",
                        "prompt": new_prompt,
                        "scenes": new_scenes,
                    })
                    backend_response = f"Generated animation with {len(new_scenes)} scenes."
            except requests.exceptions.RequestException as e:
                return Response({"error": f"Failed to generate lesson from AI service: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)

            session.animation_data["history"] = history
            session.animation_data["default_mode"] = mode
                
            session.description = (session.description or "") + f"\n\nFollow-up: {new_prompt}"
            session.save()

            ChatExchange.objects.create(
                session=session,
                mode=mode,
                user_prompt=new_prompt,
                backend_response=backend_response,
            )
            
        serializer = self.get_serializer(session)
        return Response(serializer.data)


class SessionQuizGenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            session = Session.objects.get(pk=pk, user=request.user)
        except Session.DoesNotExist:
            return Response({"error": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

        ensure_history_format(session)
        history = session.animation_data.get("history", [])

        conversation_history = []
        for item in history:
            mode = item.get("mode")
            if mode == "text":
                if item.get("prompt"):
                    conversation_history.append({"role": "user", "content": item.get("prompt")})
                if item.get("response"):
                    conversation_history.append({"role": "assistant", "content": item.get("response")})
            else:
                if item.get("prompt"):
                    conversation_history.append({"role": "user", "content": item.get("prompt")})

        params = {
            "conversation_history": json.dumps(conversation_history),
            "topic": session.title,
        }

        try:
            ai_response = requests.post(AI_QUIZ_SERVICE_URL, params=params, timeout=300)
            ai_response.raise_for_status()
        except requests.exceptions.RequestException as e:
            return Response({"error": f"Failed to generate quiz: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({"quiz": ai_response.json()}, status=status.HTTP_200_OK)


class SessionQuizFeedbackView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            session = Session.objects.get(pk=pk, user=request.user)
        except Session.DoesNotExist:
            return Response({"error": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

        user_response = request.data.get("user_response")
        if user_response is None:
            return Response({"error": "user_response is required."}, status=status.HTTP_400_BAD_REQUEST)

        params = {
            "user_response": json.dumps(user_response),
            "topic": session.title,
        }

        try:
            ai_response = requests.post(AI_QUIZ_FEEDBACK_SERVICE_URL, params=params, timeout=300)
            ai_response.raise_for_status()
        except requests.exceptions.RequestException as e:
            return Response({"error": f"Failed to generate quiz feedback: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)

        payload = ai_response.json()
        if isinstance(payload, dict):
            return Response(payload, status=status.HTTP_200_OK)
        return Response({"feedback": str(payload)}, status=status.HTTP_200_OK)
