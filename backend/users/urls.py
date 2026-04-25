from django.urls import path
from users import views

urlpatterns = [
    path('google/', views.google_auth_view, name='google-auth'),
    path('me/', views.me_view, name='me'),
]
