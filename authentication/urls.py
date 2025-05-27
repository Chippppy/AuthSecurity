from django.urls import path
from .views import RegisterView, LoginView, LogoutView, UserView, TOTPSetupView, TOTPVerifyView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('user/', UserView.as_view(), name='user'),
    path('totp/setup/', TOTPSetupView.as_view(), name='totp_setup'),
    path('totp/verify/', TOTPVerifyView.as_view(), name='totp_verify'),
] 