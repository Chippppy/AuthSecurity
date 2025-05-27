document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:8000/api/auth';
    const userInfoDiv = document.getElementById('userInfo');
    const totpSetupDiv = document.getElementById('totpSetup');
    const totpQRCodeDiv = document.getElementById('totpQRCode');
    const setupTOTPButton = document.getElementById('setupTOTP');
    const verifyTOTPButton = document.getElementById('verifyTOTP');
    const totpTokenInput = document.getElementById('totpToken');
    const logoutButton = document.getElementById('logout');
    const messageDiv = document.getElementById('message');

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

    // Function to show message
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

    // Function to fetch user info
    async function fetchUserInfo() {
        try {
            const response = await fetch(`${API_BASE_URL}/user/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                window.location.href = './index.html';
                return;
            }

            const data = await response.json();
            userInfoDiv.innerHTML = `
                <p>Username: ${data.username}</p>
                <p>Email: ${data.email}</p>
                <p>2FA Status: ${data.has_totp ? 'Enabled' : 'Not Enabled'}</p>
            `;

            // Show/hide TOTP setup based on current status
            totpSetupDiv.style.display = data.has_totp ? 'none' : 'block';
            totpQRCodeDiv.style.display = 'none';

        } catch (error) {
            console.error('Error fetching user info:', error);
            window.location.href = './index.html';
        }
    }

    // Fetch user info when page loads
    fetchUserInfo();

    // Setup TOTP button click handler
    setupTOTPButton.addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/totp/setup/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                showMessage('Error setting up 2FA', 'error');
                return;
            }

            const data = await response.json();
            const qrCodeDiv = document.getElementById('qrCode');
            qrCodeDiv.innerHTML = `<img src="${data.qr_code}" alt="QR Code">`;
            
            totpSetupDiv.style.display = 'none';
            totpQRCodeDiv.style.display = 'block';

        } catch (error) {
            console.error('Error setting up TOTP:', error);
            showMessage('Error setting up 2FA', 'error');
        }
    });

    // Verify TOTP button click handler
    verifyTOTPButton.addEventListener('click', async () => {
        const token = totpTokenInput.value.trim();
        if (!token) {
            showMessage('Please enter the verification code', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/totp/verify/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken(),
                },
                body: JSON.stringify({ token }),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('2FA setup successful!', 'success');
                setTimeout(() => {
                    totpQRCodeDiv.style.display = 'none';
                    fetchUserInfo();
                }, 1000);
            } else {
                showMessage(data.message || 'Invalid verification code', 'error');
            }
        } catch (error) {
            console.error('Error verifying TOTP:', error);
            showMessage('Error verifying code', 'error');
        }
    });

    // Logout button click handler
    logoutButton.addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/logout/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken(),
                },
                credentials: 'include'
            });

            if (response.ok) {
                window.location.href = './index.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
            showMessage('Error logging out', 'error');
        }
    });
}); 