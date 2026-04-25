from rest_framework import serializers
from users.models import User


class UserProfileSerializer(serializers.ModelSerializer):
    """Profile serializer returned after Google login / on GET /me."""
    has_openai_key = serializers.BooleanField(read_only=True)
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'profile_picture_url', 'has_openai_key',
        ]
        read_only_fields = fields

    def get_profile_picture_url(self, obj):
        """Return the Google profile picture URL, or uploaded picture URL."""
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        # Fallback to Google profile picture
        return obj.google_profile_picture or None


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating profile details (name, API key)."""
    openai_api_key = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'openai_api_key']

    def update(self, instance, validated_data):
        openai_key = validated_data.pop('openai_api_key', None)
        if openai_key is not None:
            instance.set_openai_api_key(openai_key)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
