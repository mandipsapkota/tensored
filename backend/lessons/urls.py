from django.urls import path
from .views import SessionListCreateView, SessionDetailView, SessionQuizGenerateView, SessionQuizFeedbackView

urlpatterns = [
    path('sessions/', SessionListCreateView.as_view(), name='session-list-create'),
    path('sessions/<int:pk>/', SessionDetailView.as_view(), name='session-detail'),
    path('sessions/<int:pk>/quiz/generate/', SessionQuizGenerateView.as_view(), name='session-quiz-generate'),
    path('sessions/<int:pk>/quiz/feedback/', SessionQuizFeedbackView.as_view(), name='session-quiz-feedback'),
]
