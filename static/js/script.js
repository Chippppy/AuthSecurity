document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    const totpGroup = document.getElementById('totpGroup');
    const totpToken = document.getElementById('totpToken');
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

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const totp = totpToken.value.trim();

        try {
            const response = await fetch(`${API_BASE_URL}/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken(),
                },
                body: JSON.stringify({
                    username,
                    password,
                    totp_token: totp || undefined
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                if (data.requires_totp) {
                    // Show TOTP input field
                    totpGroup.style.display = 'block';
                    showMessage('Please enter your 2FA code', 'info');
                    return;
                }

                showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = './dashboard.html';
                }, 1000);
            } else {
                showMessage(data.message || 'Login failed', 'error');
                if (!data.requires_totp) {
                    totpGroup.style.display = 'none';
                    totpToken.value = '';
                }
            }
        } catch (error) {
            showMessage('An error occurred. Please try again.', 'error');
            console.error('Login error:', error);
        }
    });

    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        
        if (type === 'success') {
            messageDiv.style.backgroundColor = 'var(--success-color)';
        } else if (type === 'info') {
            messageDiv.style.backgroundColor = 'var(--primary-color)';
            messageDiv.style.color = 'var(--text-color)';
        }
        
        // Hide message after 3 seconds if it's an error
        if (type === 'error') {
            setTimeout(() => {
                messageDiv.className = 'message';
            }, 3000);
        }
    }
}); 