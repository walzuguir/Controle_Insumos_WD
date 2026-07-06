import { useNavigate, useLocation } from 'react-router-dom';

  const nomesTelas = {
    '/saida': 'Registrar Saída',
    '/gestor': 'Painel do Gestor',
    '/dashboard': 'Dashboard de Estoque',
    '/relatorio': 'Relatório de Movimentações',
    '/gaps': 'Painel de GAPs',
    '/entrada': 'Registrar Entrada',
  };

export default function Header() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const location = useLocation();
  const telaNome = nomesTelas[location.pathname] || 'Controle de Insumos';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 24px',
      borderBottom: '1px solid #e5e7eb',
      background: '#f9fafb'
    }}>
      <div>
        <span style={{ fontWeight: '500', fontSize: '15px' }}>
          Controle de Insumos
        </span>
        <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: '8px' }}>/ {telaNome}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          {usuario?.nome} — {usuario?.filial_id === 'gestor' ? 'Gestor' : `Filial ${usuario?.filial_id}`}
        </span>
        <button
          onClick={handleLogout}
          style={{
            padding: '6px 12px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#ef4444'
          }}
        >
          Sair
        </button>
      </div>
    </div>
  );
}