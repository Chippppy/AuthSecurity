from django.db import models
from django.contrib.auth.models import User
import pyotp

class TOTPDevice(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    secret_key = models.CharField(max_length=32, unique=True, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.secret_key:
            self.secret_key = pyotp.random_base32()
        super().save(*args, **kwargs)

    def get_totp(self):
        return pyotp.TOTP(self.secret_key)

    def verify_token(self, token):
        totp = self.get_totp()
        return totp.verify(token)

    def get_provisioning_uri(self):
        totp = self.get_totp()
        return totp.provisioning_uri(
            name=self.user.email or self.user.username,
            issuer_name="HC-2FA"
        )
