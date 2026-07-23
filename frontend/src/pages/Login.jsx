import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [aviso, setAviso] = useState('');

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('expirado')) {
      setAviso('Sua sessão expirou. Faça login novamente.');
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, senha });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
      navigate('/home');
    } catch (error) {
      const mensagem = error.response
        ? 'Email ou senha incorretos'
        : 'Não foi possível conectar ao servidor. Verifique sua conexão.';

      setTimeout(() => {
        setErro(mensagem);
        setLoading(false);
      }, 1000);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '0 16px' }}>
      <div style={{
        background: 'var(--cor-superficie)',
        border: '1px solid var(--cor-borda)',
        borderRadius: '12px',
        padding: '32px'
      }}>
        <h2 style={{ color: 'var(--cor-texto-titulo)', marginTop: 0, marginBottom: '24px', textAlign: 'center' }}>
          Controle de Insumos
        </h2>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="email" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--cor-texto-suave)' }}>Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              style={{ display: 'block', width: '100%', padding: '10px', marginTop: '6px', background: 'var(--cor-superficie-2)', border: '1px solid var(--cor-borda)', borderRadius: '6px', fontSize: '14px', color: 'var(--cor-texto)' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="senha" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--cor-texto-suave)' }}>Senha</label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '10px', marginTop: '6px', background: 'var(--cor-superficie-2)', border: '1px solid var(--cor-borda)', borderRadius: '6px', fontSize: '14px', color: 'var(--cor-texto)' }}
            />
          </div>
          {aviso && <p style={{ color: 'var(--cor-alerta)', fontSize: '14px', marginBottom: '16px' }}>{aviso}</p>}
          {erro && <p style={{ color: 'var(--cor-perigo)', fontSize: '14px', marginBottom: '16px' }}>{erro}</p>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', background: loading ? 'var(--cor-superficie-2)' : 'var(--cor-destaque)', color: loading ? 'var(--cor-texto-suave)' : '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', transition: 'background 0.2s' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}