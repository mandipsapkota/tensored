import requests as http_requests
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.conf import settings

from users.models import User
from users.serializers import UserProfileSerializer, UpdateProfileSerializer
from users.authentication import generate_jwt


# ──────────────────── Google OAuth ────────────────────────

def verify_google_token(credential):
    """
    Verify a Google ID token (credential) by calling Google's tokeninfo endpoint.
    Returns the decoded user info dict or None on failure.
    """
    resp = http_requests.get(
        'https://oauth2.googleapis.com/tokeninfo',
        params={'id_token': credential},
        timeout=10,
    )
    if resp.status_code != 200:
        return None

    data = resp.json()

    # Verify the token was issued for our app
    client_id = settings.GOOGLE_CLIENT_ID
    if client_id and data.get('aud') != client_id:
        return None

    return data


@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth_view(request):
    """
    POST /api/auth/google/
    Body (JSON): { "credential": "<Google ID token>" }

    The frontend sends the credential obtained from Google Identity Services.
    The backend verifies it with Google, creates or finds the user,
    and returns a JWT + user profile.
    """
    credential = request.data.get('credential')
    if not credential:
        return Response(
            {'detail': 'Missing "credential" field (Google ID token).'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    google_data = verify_google_token(credential)
    if google_data is None:
        return Response(
            {'detail': 'Invalid or expired Google token.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    email = google_data.get('email')
    if not email:
        return Response(
            {'detail': 'Google account has no email.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Find existing user or create a new one
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': email.split('@')[0],
            'first_name': google_data.get('given_name', ''),
            'last_name': google_data.get('family_name', ''),
            'google_profile_picture': google_data.get('picture', ''),
        },
    )

    if not created:
        # Update profile picture on every login in case it changed
        user.google_profile_picture = google_data.get('picture', user.google_profile_picture)
        user.save(update_fields=['google_profile_picture'])

    # User has no usable password — they authenticate via Google only
    if not user.has_usable_password():
        user.set_unusable_password()
        user.save(update_fields=['password'])

    token = generate_jwt(user)
    profile = UserProfileSerializer(user, context={'request': request}).data

    return Response({
        'token': token,
        'user': profile,
        'created': created,  # true if this was a new signup
    }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)


# ──────────────────── Profile (me) ────────────────────────

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def me_view(request):
    """
    GET  /api/auth/me/   → return current user's profile
    PATCH /api/auth/me/  → update name or OpenAI key
    """
    user = request.user

    if request.method == 'GET':
        serializer = UserProfileSerializer(user, context={'request': request})
        return Response(serializer.data)

    # PATCH
    serializer = UpdateProfileSerializer(user, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    serializer.save()

    # Return the full profile after update
    profile = UserProfileSerializer(user, context={'request': request}).data
    return Response(profile)
