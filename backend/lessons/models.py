from django.db import models
from django.conf import settings

class Session(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sessions')
    title = models.CharField(max_length=255)
    description = models.TextField()
    animation_data = models.JSONField(help_text="Stores the AI-generated scenes JSON")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.user.email})"

    class Meta:
        ordering = ['-created_at']
