from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import login, logout, authenticate
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, TOTPVerifySerializer
from .models import TOTPDevice
import pyotp
import qrcode
import qrcode.image.svg
from io import BytesIO
import base64

# Create your views here.

class RegisterView(generics.CreateAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                username=serializer.validated_data['username'],
                password=serializer.validated_data['password']
            )
            if user:
                try:
                    totp_device = TOTPDevice.objects.get(user=user, is_verified=True)
                    totp_token = serializer.validated_data.get('totp_token')
                    
                    if not totp_token:
                        return Response({
                            'requires_totp': True,
                            'message': 'Please provide TOTP token'
                        }, status=status.HTTP_200_OK)
                    
                    if not totp_device.verify_token(totp_token):
                        return Response({
                            'message': 'Invalid TOTP token'
                        }, status=status.HTTP_401_UNAUTHORIZED)
                except TOTPDevice.DoesNotExist:
                    pass  # TOTP not set up, proceed with normal login
                
                login(request, user)
                return Response({
                    'user': UserSerializer(user).data,
                    'message': 'Login successful'
                })
            return Response({
                'message': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({'message': 'Logout successful'})

class UserView(generics.RetrieveAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class TOTPSetupView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        # Delete any existing unverified TOTP device
        TOTPDevice.objects.filter(user=request.user, is_verified=False).delete()
        
        # Check if user already has a verified TOTP device
        if hasattr(request.user, 'totpdevice') and request.user.totpdevice.is_verified:
            return Response({
                'message': 'TOTP already set up'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create new TOTP device
        device = TOTPDevice.objects.create(user=request.user)

        try:
            # Generate QR code
            provisioning_uri = device.get_provisioning_uri()
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(provisioning_uri)
            qr.make(fit=True)

            # Create QR code image
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()

            return Response({
                'secret': device.secret_key,
                'qr_code': f'data:image/png;base64,{qr_code_base64}'
            })
        except Exception as e:
            # Clean up on error
            device.delete()
            return Response({
                'message': 'Error generating QR code'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TOTPVerifyView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = TOTPVerifySerializer

    def post(self, request):
        try:
            device = TOTPDevice.objects.get(user=request.user, is_verified=False)
        except TOTPDevice.DoesNotExist:
            return Response({
                'message': 'No TOTP device found'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            if device.verify_token(serializer.validated_data['token']):
                device.is_verified = True
                device.save()
                return Response({
                    'message': 'TOTP verified successfully'
                })
            return Response({
                'message': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
