const BASE = '/api';
const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
};

async function request(path, options = {}) {
    const isFormData = options.body instanceof FormData;
    const headers = {
        'Authorization': 'Bearer ' + getToken(),
        ...options.headers
    };

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(BASE + path, {
        headers,
        ...options
    });

    if (res.status === 401 || res.status === 403) {
        // Automatically redirect on unauthorized (if not on login/register)
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
            clearAuth();
        }
    }

    if (!res.ok) {
        const err = await res.json();
        throw err;
    }
    
    // For blob downloads (like iCal)
    if (options.isBlob) {
        return res.blob();
    }

    return res.json();
}
