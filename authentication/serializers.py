from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import TOTPDevice

class UserSerializer(serializers.ModelSerializer):
    has_totp = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'has_totp')
        read_only_fields = ('id', 'has_totp')

    def get_has_totp(self, obj):
        try:
            return obj.totpdevice.is_verified
        except TOTPDevice.DoesNotExist:
            return False

class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        validate_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    totp_token = serializers.CharField(required=False)

class TOTPVerifySerializer(serializers.Serializer):
    token = serializers.CharField() 