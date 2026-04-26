from django.contrib import admin
from .models import ChatExchange


@admin.register(ChatExchange)
class ChatExchangeAdmin(admin.ModelAdmin):
	list_display = ('id', 'session', 'mode', 'created_at')
	search_fields = ('session__title', 'session__user__email', 'user_prompt', 'backend_response')
	list_filter = ('mode', 'created_at')
