const API_URL = window.location.origin;

// Register Function
async function register(username, email, password) {
    try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Register error:', error);
        return { success: false, message: 'Terjadi kesalahan saat registrasi' };
    }
}

// Login Function
async function login(username, password) {
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (data.success) {
            // Simpan token dan user data
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
        }
        
        return data;
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Terjadi kesalahan saat login' };
    }
}

// Logout Function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Get auth token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Check if user is admin
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// Redirect if not logged in
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/login';
    }
}

// Redirect if not admin
function requireAdmin() {
    requireAuth();
    if (!isAdmin()) {
        alert('Akses ditolak. Hanya admin yang diizinkan.');
        window.location.href = '/dashboard';
    }
}