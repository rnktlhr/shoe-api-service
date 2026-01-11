// Auto redirect if already logged in
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
        try {
            const user = JSON.parse(userStr);
            
            // Redirect based on role
            if (user.role === 'admin') {
                window.location.href = '/admin';
            } else {
                window.location.href = '/dashboard';
            }
        } catch (error) {
            // If error parsing, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }
});