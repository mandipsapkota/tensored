from django.db import models
from lessons.models import Session


class ChatExchange(models.Model):
	session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='chat_exchanges')
	mode = models.CharField(max_length=16, default='text')
	user_prompt = models.TextField()
	backend_response = models.TextField(blank=True, default='')
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['created_at']

	def __str__(self):
		return f"{self.session_id} | {self.mode}"
