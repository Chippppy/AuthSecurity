# Secure Authentication System

A secure authentication system built with Django REST Framework backend and vanilla JavaScript frontend. Features include user registration, login, session management, and Two-Factor Authentication (2FA) using Time-Based One-Time Password (TOTP).

## Features

- User Registration with email validation regex check
- Secure Login with session management
- Two-Factor Authentication (2FA)
  - TOTP-based authentication (RFC 6238 compliant)
  - QR code setup for authenticator apps
  - Compatible with Google Authenticator, Authy, and other TOTP apps
- CSRF Protection
- Modern, responsive UI
- RESTful API endpoints
- Secure password validation

## Project Structure

```
AuthSecurity/
├── auth_backend/              # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── authentication/            # Django app for auth functionality
│   ├── migrations/
│   ├── models.py             # User and TOTP device models
│   ├── serializers.py        # API serializers
│   ├── urls.py              # API endpoint routing
│   └── views.py             # API view logic
├── static/                   # Static files
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── register.js
│   │   ├── script.js
│   │   └── dashboard.js
│   ├── dashboard.html
│   ├── index.html
│   └── register.html
├── manage.py            # Django management script
├── requirements.txt     # Project dependencies
└── README.md            # This file
```

## API Endpoints

- `/api/auth/register/` - User registration
- `/api/auth/login/` - User login
- `/api/auth/logout/` - User logout
- `/api/auth/user/` - Get current user info
- `/api/auth/totp/setup/` - Set up 2FA
- `/api/auth/totp/verify/` - Verify 2FA token

## Setup Instructions

1. Create and activate virtual environment:
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate # Linux/Mac
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Create superuser (optional but recommended :D):
```bash
python manage.py createsuperuser
```

5. Run development server:
```bash
python manage.py runserver
```

6. Open new terminal and start web frontend server:
```bash
cd ./static/
python -m http.server 8001
```

7. Open web browser to url: [http://localhost:8001](http://localhost:8001)

8. Create new user or login with existing credentials.

9. Configure 2FA authentication for user.

## Security Features

1. **Password Security**
   - Password strength validation
   - Secure password hashing
   - Prevention of common passwords

2. **Two-Factor Authentication**
   - TOTP-based authentication (RFC 6238)
   - Secure secret key generation
   - QR code for easy setup
   - Compatible with standard authenticator apps

3. **Session Security**
   - Secure session management
   - CSRF protection
   - Session timeout

4. **API Security**
   - Token-based authentication
   - Rate limiting
   - CORS configuration
   - Input validation

## Dependencies

- Django 5.2.1
- Django REST Framework 3.16.0
- python-jose
- pyotp
- qrcode
- Pillow
- corsheaders
- SQLite
