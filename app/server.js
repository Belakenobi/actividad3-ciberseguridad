const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const SECRET = process.env.JWT_SECRET || 'cambia-este-secreto-en-produccion';

const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
  { id: 2, username: 'user',  password: 'user123',  role: 'user'  },
];

function authenticateJWT(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], SECRET, { algorithms: ['HS256'] });
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function requireRole(role) {
  return (req, res, next) =>
    req.user.role === role ? next() : res.status(403).json({ error: 'Permisos insuficientes' });
}

app.get('/api/public', (req, res) => res.json({ message: 'Endpoint público' }));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const u = users.find(x => x.username === username && x.password === password);
  if (!u) return res.status(401).json({ error: 'Credenciales inválidas' });
  const token = jwt.sign({ sub: u.id, role: u.role }, SECRET, { algorithm: 'HS256', expiresIn: '15m' });
  res.json({ token });
});

app.get('/api/admin', authenticateJWT, requireRole('admin'), (req, res) =>
  res.json({ message: 'Panel de administración', user: req.user }));

app.get('/api/users', authenticateJWT, (req, res) =>
  res.json(users.map(({ id, username, role }) => ({ id, username, role }))));

app.listen(3000, () => console.log('API en http://localhost:3000'));
