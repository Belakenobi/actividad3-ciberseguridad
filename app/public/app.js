const page = document.body.dataset.page;
const msg = document.getElementById('msg');

function setMsg(text) { if (msg) msg.textContent = text; }

async function api(path, options = {}) {
  const headers = Object.assign({}, options.headers);
  const token = sessionStorage.getItem('token');
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(path, Object.assign({}, options, { headers }));
  let data = null;
  try { data = await res.json(); } catch (e) { /* sin cuerpo JSON */ }
  return { status: res.status, data };
}

function logout() {
  sessionStorage.removeItem('token');
  location.href = '/';
}

function showWho() {
  const token = sessionStorage.getItem('token');
  const who = document.getElementById('who');
  if (!token || !who) return;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    who.textContent = 'Rol: ' + payload.role;   // solo informativo; el servidor es quien valida
  } catch (e) { /* ignorar */ }
}

if (page === 'login') {
  document.getElementById('loginForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const body = JSON.stringify({
      username: document.getElementById('username').value,
      password: document.getElementById('password').value,
    });
    const r = await api('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    if (r.status === 200 && r.data && r.data.token) {
      sessionStorage.setItem('token', r.data.token);
      location.href = '/dashboard.html';
    } else {
      setMsg('Credenciales inválidas');
    }
  });
}

if (page === 'dashboard' || page === 'admin') {
  document.getElementById('logout').addEventListener('click', logout);
  showWho();
  if (!sessionStorage.getItem('token')) location.href = '/';
}

if (page === 'dashboard') {
  api('/api/users').then((r) => {
    if (r.status === 401) return logout();
    if (r.status !== 200) return setMsg('Error ' + r.status);
    const tbody = document.querySelector('#usersTable tbody');
    r.data.forEach((u) => {
      const tr = document.createElement('tr');
      [u.id, u.username, u.role].forEach((v) => {
        const td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  });
}

if (page === 'admin') {
  api('/api/admin').then((r) => {
    if (r.status === 401) return logout();
    if (r.status === 403) return setMsg('Acceso denegado (403): se requiere el rol admin.');
    if (r.status !== 200) return setMsg('Error ' + r.status);
    document.getElementById('adminData').textContent = JSON.stringify(r.data, null, 2);
  });
}
