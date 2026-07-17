import { useNavigate, useLocation, Link } from 'react-router-dom';

const nomesTelas = {
  '/saida': 'Registrar Saída',
  '/gestor': 'Painel do Gestor',
  '/dashboard': 'Dashboard de Estoque',
  '/relatorio': 'Relatório de Movimentações',
  '/gaps': 'Painel de GAPs',
  '/entrada': 'Registrar Entrada',
  '/home': 'Início',
};

export default function Header() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const location = useLocation();
  const telaNome = nomesTelas[location.pathname] || 'Controle de Insumos';

  const ehGestor = usuario?.filial_id === 'gestor';

  const menuLinks = [
    { nome: 'Início', rota: '/home' },
    { nome: 'Entrada', rota: '/entrada' },
    { nome: 'Saída', rota: '/saida' },
    { nome: 'Dashboard', rota: '/dashboard' },
    { nome: 'Relatório', rota: '/relatorio' },
  ];

  if (ehGestor) {
    menuLinks.push(
      { nome: 'GAPs', rota: '/gaps' },
      { nome: 'Gestor', rota: '/gestor' },
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
  };

  return (
    <>
      <div style={{
        borderBottom: '1px solid #e5e7eb',
        background: '#f9fafb'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontWeight: '500', fontSize: '15px' }}>
              Controle de Insumos
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>
              {usuario?.filial_id === 'gestor' ? 'Gestor' : `Filial ${usuario?.filial_id}`}
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
                color: '#ef4444',
                flexShrink: 0
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', padding: '8px 24px', background: 'white', borderBottom: '1px solid #e5e7eb', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {menuLinks.map(link => (
          <Link
            key={link.rota}
            to={link.rota}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              textDecoration: 'none',
              fontWeight: location.pathname === link.rota ? '600' : '400',
              color: location.pathname === link.rota ? '#2563eb' : '#374151',
              background: location.pathname === link.rota ? '#eff6ff' : 'transparent',
              flexShrink: 0,
            }}
          >
            {link.nome}
          </Link>
        ))}
      </div>
    </>
  );
}