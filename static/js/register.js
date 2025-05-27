document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');
    const API_BASE_URL = 'http://localhost:8000/api/auth';

    // Function to get CSRF token from cookies
    function getCSRFToken() {
        const name = 'csrftoken=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookieArray = decodedCookie.split(';');
        for (let cookie of cookieArray) {
            while (cookie.charAt(0) === ' ') {
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(name) === 0) {
                return cookie.substring(name.length, cookie.length);
            }
        }
        return '';
    }

    // Check if user is already authenticated
    async function checkAuthStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/user/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                // User is authenticated, redirect to dashboard
                window.location.href = './dashboard.html';
                return;
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
    }

    // Check auth status when page loads
    checkAuthStatus();

    // Get CSRF token when page loads
    fetch(`${API_BASE_URL}/login/`, {
        method: 'GET',
        credentials: 'include',
    }).catch(error => console.log('Initial CSRF fetch error:', error));

    // Basic password validation
    function validatePassword(password) {
        const minLength = 8;
        const hasNumber = /\d/.test(password);
        const hasLetter = /[a-zA-Z]/.test(password);
        
        const errors = [];
        if (password.length < minLength) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!hasNumber) {
            errors.push('Password must include at least one number');
        }
        if (!hasLetter) {
            errors.push('Password must include at least one letter');
        }
        
        return errors;
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const password2 = document.getElementById('password2').value;

        // Basic form validation
        if (!username || !email || !password || !password2) {
            showMessage('Please fill in all fields', 'error');
            return;
        }

        // Password validation
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            showMessage(passwordErrors.join('. '), 'error');
            return;
        }

        // Password match validation
        if (password !== password2) {
            showMessage('Passwords do not match', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken(),
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    password2
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Registration successful! Redirecting to login...', 'success');
                registerForm.reset();
                
                // Redirect to login page after successful registration
                setTimeout(() => {
                    window.location.href = './index.html';
                }, 2000);
            } else {
                const errorMessage = data.username || data.email || data.password || data.message || 'Registration failed';
                showMessage(errorMessage, 'error');
            }
        } catch (error) {
            showMessage('An error occurred. Please try again.', 'error');
            console.error('Registration error:', error);
        }
    });

    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        
        if (type === 'success') {
            messageDiv.style.backgroundColor = 'var(--success-color)';
        }
        
        // Hide message after 3 seconds if it's an error
        if (type === 'error') {
            setTimeout(() => {
                messageDiv.className = 'message';
            }, 3000);
        }
    }
}); 