from rest_framework import serializers
from .models import Session

class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ['id', 'title', 'description', 'animation_data', 'created_at']
        read_only_fields = ['id', 'created_at']
