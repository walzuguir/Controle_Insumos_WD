const jwt = require('jsonwebtoken');

const autenticar = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    const mensagem = error.name === 'TokenExpiredError'
      ? 'Sessão expirada'
      : 'Token inválido';
    return res.status(401).json({ error: mensagem });
  }
};

module.exports = autenticar;