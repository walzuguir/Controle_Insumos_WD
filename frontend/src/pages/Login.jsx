import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, senha });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
      navigate('/home');
    } catch {
      setTimeout(() => {
        setErro('Email ou senha incorretos');
        setLoading(false);
      }, 1000);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '32px' }}>
      <h2>Controle de Insumos</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="email" style={{ fontSize: '14px', fontWeight: '500', color: '#436eb3' }}>Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="senha" style={{ fontSize: '14px', fontWeight: '500', color: '#436eb3' }}>Senha</label>
          <input
            type="password"
            id="senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
          />
        </div>
        {erro && <p style={{ color: 'red' }}>{erro}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: loading ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}