const SESSION_KEY = 'ks-auth';

function checkAuth() {
    if (sessionStorage.getItem(SESSION_KEY) !== 'true') {
        window.location.replace('/');
    }
}

function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.replace('/');
}
