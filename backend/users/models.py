from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from cryptography.fernet import Fernet, InvalidToken
import base64
from typing import Optional


def get_fernet():
    """Return a Fernet instance using the project encryption key."""
    key = settings.FIELD_ENCRYPTION_KEY
    # Fernet requires a url-safe base64-encoded 32-byte key.
    # If the env var is already a valid Fernet key, use it directly.
    # Otherwise, derive one by padding/hashing.
    try:
        return Fernet(key.encode() if isinstance(key, str) else key)
    except (ValueError, Exception):
        # Fallback: hash the key to produce a valid Fernet key
        import hashlib
        digest = hashlib.sha256(key.encode()).digest()
        fernet_key = base64.urlsafe_b64encode(digest)
        return Fernet(fernet_key)


class User(AbstractUser):
    """
    Custom user model for Animax.
    Extends Django's AbstractUser with:
      - profile_picture: user avatar (uploaded or from Google)
      - openai_api_key_encrypted: Fernet-encrypted OpenAI API key
    """
    email = models.EmailField(unique=True)
    profile_picture = models.ImageField(
        upload_to='profile_pics/',
        null=True,
        blank=True,
    )
    # URL from Google's profile picture (updated on every login)
    google_profile_picture = models.URLField(max_length=500, blank=True, default='')
    # We never store the raw API key — only the Fernet-encrypted ciphertext.
    openai_api_key_encrypted = models.TextField(blank=True, default='')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    # ---- helpers for the OpenAI key ----

    def set_openai_api_key(self, raw_key: str):
        """Encrypt and store the OpenAI API key."""
        if not raw_key:
            self.openai_api_key_encrypted = ''
            return
        f = get_fernet()
        self.openai_api_key_encrypted = f.encrypt(raw_key.encode()).decode()

    def get_openai_api_key(self) -> Optional[str]:
        """Decrypt and return the OpenAI API key, or None if not set."""
        if not self.openai_api_key_encrypted:
            return None
        f = get_fernet()
        try:
            return f.decrypt(self.openai_api_key_encrypted.encode()).decode()
        except InvalidToken:
            return None

    @property
    def has_openai_key(self) -> bool:
        return bool(self.openai_api_key_encrypted)

    def __str__(self):
        return self.email
