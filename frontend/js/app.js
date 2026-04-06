// ===== GigShield AI — Frontend Utilities =====
const API_BASE = 'https://gigshield-ai-44yj.onrender.com';

// Auth helpers
function getToken() { return localStorage.getItem('gs_token'); }
function setToken(token) { localStorage.setItem('gs_token', token); }
function getUser() { try { return JSON.parse(localStorage.getItem('gs_user')); } catch { return null; } }
function setUser(user) { localStorage.setItem('gs_user', JSON.stringify(user)); }
function isLoggedIn() { return !!getToken(); }
function isAdmin() { return getUser()?.is_admin === true; }

function logout() {
    localStorage.removeItem('gs_token');
    localStorage.removeItem('gs_user');
    window.location.href = '/login.html';
}

// API call helper
async function api(endpoint, options = {}) {
    const token = getToken();
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
}

async function apiGet(endpoint) { return api(endpoint); }
async function apiPost(endpoint, body) {
    const isForm = body instanceof FormData;
    return api(endpoint, { method: 'POST', body: isForm ? body : JSON.stringify(body) });
}

// Toast notifications
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
}

// Format currency
function formatCurrency(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN');
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Mobile menu toggle
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const links = document.querySelector('.navbar-links');
    if (hamburger && links) {
        hamburger.addEventListener('click', () => links.classList.toggle('show'));
    }
}

// Update navbar based on auth status
function updateNavbar() {
    const navRight = document.getElementById('nav-right');
    if (!navRight) return;
    if (isLoggedIn()) {
        const user = getUser();
        if (user?.is_admin) {
            navRight.innerHTML = `
                <a href="/admin.html" class="active">Admin Panel</a>
                <a href="#" onclick="logout()" class="btn btn-outline btn-sm">Logout</a>
            `;
        } else {
            navRight.innerHTML = `
               <a href="/dashboard.html">Dashboard</a>
               <a href="/buy-policy.html">Buy Policy</a>
               <a href="/claims.html">Claims</a>
                <a href="#" onclick="logout()" class="btn btn-outline btn-sm">Logout</a>
            `;
        }
    }
}

// Loading overlay
function showLoading() {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="spinner"></div><p style="color:var(--text-light);">Loading...</p>';
    document.body.appendChild(overlay);
}

function hideLoading() {
    document.getElementById('loading-overlay')?.remove();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    updateNavbar();
});
