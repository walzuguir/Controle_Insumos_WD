import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import {
  LayoutDashboard,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Package,
  Building2,
  Filter
} from 'lucide-react';
import SeletorInsumo from '../components/SeletorInsumo';


export default function Dashboard() {
  const [saldos, setSaldos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filiais, setFiliais] = useState([]);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const ehGestor = usuario?.filial_id === 'gestor';
  const filialDoUsuario = usuario?.filial_id || '';

  // 🔧 FILIAL ATUAL: lê da URL, se não tiver, fica vazio (Todas)
  const filialAtual = useMemo(() => {
    const daURL = searchParams.get('filial') ||
      new URLSearchParams(location.search).get('filial');
    return daURL || ''; // ← sem fallback, vazio = "Todas"
  }, [location.search]);

  const [insumos, setInsumos] = useState([]);
  const [insumoSelecionado, setInsumoSelecionado] = useState('');

  // 🔧 CARREGAR DADOS
  useEffect(() => {
    api.get('/saldos').then(res => {
      let dados = res.data;
      if (!ehGestor) {
        dados = dados.filter(s => s.filial_id === filialDoUsuario);
      }
      setSaldos(dados);
      api.get('/filiais').then(res => setFiliais(res.data));
      api.get('/insumos').then(res => setInsumos(res.data));
      setLoading(false);
    });
  }, []);

  // 🔧 FUNÇÃO PARA MUDAR FILIAL
  const mudarFilial = (novaFilial) => {
    const url = novaFilial ? `/dashboard?filial=${novaFilial}` : '/dashboard';
    navigate(url);
  };

  const saldosFiltrados = saldos.filter(s =>
    (!filialAtual || s.filial_id === filialAtual) &&
    (!insumoSelecionado || s.insumo_id === insumoSelecionado)
  );

  const criticos = saldosFiltrados.filter(s => s.status === 'critico');
  const ok = saldosFiltrados.filter(s => s.status === 'ok');

  const thStyle = { padding: '10px', textAlign: 'left', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto-suave)', fontSize: '13px', fontWeight: '500' };
  const tdStyle = { padding: '10px', border: '1px solid var(--cor-borda)' };
  const thCritico = { ...thStyle, border: '1px solid var(--cor-perigo)' };
  const tdCritico = { padding: '10px', border: '1px solid var(--cor-perigo)' };

  return (
    <>
      <Header />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 16px' }}>
        <h2 style={{ color: 'var(--cor-texto-titulo)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LayoutDashboard size={24} />
          Dashboard de Estoque
        </h2>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', marginTop: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          {ehGestor && (
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--cor-texto-suave)', marginRight: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building2 size={14} />
                Filtrar por filial:
              </label>
              <select
                value={filialAtual}
                onChange={(e) => mudarFilial(e.target.value)}
                style={{ padding: '9px', background: 'var(--cor-superficie-2)', border: '1px solid var(--cor-borda)', borderRadius: '6px', fontSize: '14px', color: 'var(--cor-texto)' }}
              >
                <option value="">Todas as filiais</option>
                {filiais.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--cor-texto-suave)', marginRight: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={14} />
              Filtrar por insumo:
            </label>
            <SeletorInsumo
              insumos={insumos}
              valor={insumoSelecionado}
              onChange={(id) => setInsumoSelecionado(id)}
              placeholder="Todos os insumos"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', marginTop: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', padding: '20px', background: 'var(--cor-sucesso-bg)', borderRadius: '12px', border: '1px solid var(--cor-sucesso)' }}>
            <p style={{ fontSize: '13px', color: 'var(--cor-texto-suave)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={16} color="var(--cor-sucesso)" />
              Itens em estoque normal
            </p>
            <p style={{ fontSize: '28px', fontWeight: '500', color: 'var(--cor-sucesso)', margin: 0 }}>{ok.length}</p>
          </div>
          <div style={{ flex: '1 1 200px', padding: '20px', background: 'var(--cor-perigo-bg)', borderRadius: '12px', border: '1px solid var(--cor-perigo)' }}>
            <p style={{ fontSize: '13px', color: 'var(--cor-texto-suave)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={16} color="var(--cor-perigo)" />
              Itens em estado crítico
            </p>
            <p style={{ fontSize: '28px', fontWeight: '500', color: 'var(--cor-perigo)', margin: 0 }}>{criticos.length}</p>
          </div>
        </div>

        {criticos.length > 0 && (
          <>
            <h3 style={{ color: 'var(--cor-perigo)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={18} />
              Atenção — Estoque crítico
            </h3>
            <div style={{ overflowX: 'auto', maxWidth: '100%', marginBottom: '32px' }}>
              <table style={{ minWidth: '600px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--cor-perigo-bg)' }}>
                    <th style={thCritico}>Filial</th>
                    <th style={thCritico}>Insumo</th>
                    <th style={thCritico}>Unidade</th>
                    <th style={thCritico}>Saldo</th>
                    <th style={thCritico}>Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  {criticos.map((s, i) => (
                    <tr key={i}>
                      <td style={tdCritico}>{s.filial_nome}</td>
                      <td style={tdCritico}>{s.insumo_nome}</td>
                      <td style={tdCritico}>{s.insumo_unidade}</td>
                      <td style={{ ...tdCritico, color: 'var(--cor-perigo)', fontWeight: '500' }}>{s.saldo}</td>
                      <td style={tdCritico}>{s.estoque_minimo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <h3 style={{ marginBottom: '12px', color: 'var(--cor-texto-titulo)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Package size={18} />
          Estoque atual
        </h3>
        {loading && <p style={{ color: 'var(--cor-texto-suave)' }}>Carregando...</p>}
        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--cor-superficie-2)' }}>
                <th style={thStyle}>Filial</th>
                <th style={thStyle}>Insumo</th>
                <th style={thStyle}>Unidade</th>
                <th style={thStyle}>Saldo</th>
                <th style={thStyle}>Mínimo</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {saldosFiltrados.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" style={{ padding: '16px', textAlign: 'center', color: 'var(--cor-texto-suave)' }}>
                    <AlertCircle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Nenhum dado encontrado
                  </td>
                </tr>
              )}
              {saldosFiltrados.map((s, i) => (
                <tr key={i} style={{ background: s.status === 'critico' ? 'var(--cor-perigo-bg)' : 'transparent' }}>
                  <td style={tdStyle}>{s.filial_nome}</td>
                  <td style={tdStyle}>{s.insumo_nome}</td>
                  <td style={tdStyle}>{s.insumo_unidade}</td>
                  <td style={{ ...tdStyle, fontWeight: '500', color: s.status === 'critico' ? 'var(--cor-perigo)' : 'var(--cor-sucesso)' }}>{s.saldo}</td>
                  <td style={tdStyle}>{s.estoque_minimo}</td>
                  <td style={tdStyle}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: s.status === 'critico' ? 'var(--cor-perigo-bg)' : 'var(--cor-sucesso-bg)', color: s.status === 'critico' ? 'var(--cor-perigo)' : 'var(--cor-sucesso)', border: `1px solid ${s.status === 'critico' ? 'var(--cor-perigo)' : 'var(--cor-sucesso)'}` }}>
                      {s.status === 'critico' ? 'Crítico' : 'Ok'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}