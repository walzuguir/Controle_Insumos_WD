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
    ...(ehGestor ? [{ nome: 'Entrada', rota: '/entrada' }] : []),
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
        borderBottom: '1px solid var(--cor-borda)',
        background: 'var(--cor-header)'
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
            <span style={{ fontWeight: '500', fontSize: '15px', color: 'var(--cor-texto-titulo)' }}>
              Controle de Insumos
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--cor-texto-suave)', whiteSpace: 'nowrap' }}>
              {usuario?.filial_id === 'gestor' ? 'Gestor' : `Filial ${usuario?.filial_id}`}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                border: '1px solid var(--cor-borda)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--cor-perigo)',
                flexShrink: 0,
                transition: 'background 0.2s'
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      <div style={{
        background: 'var(--cor-superficie)',
        borderBottom: '1px solid var(--cor-borda)'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '8px 16px',
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
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
                color: location.pathname === link.rota ? 'var(--cor-destaque)' : 'var(--cor-texto-suave)',
                background: location.pathname === link.rota ? 'rgba(30, 155, 215, 0.12)' : 'transparent',
                flexShrink: 0,
                transition: 'color 0.2s, background 0.2s'
              }}
            >
              {link.nome}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}