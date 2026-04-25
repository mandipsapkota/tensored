from django.contrib import admin
from users.models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'username', 'first_name', 'last_name', 'has_openai_key', 'is_staff']
    search_fields = ['email', 'username']
    readonly_fields = ['openai_api_key_encrypted']
