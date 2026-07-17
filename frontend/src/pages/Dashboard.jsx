import { useState, useEffect } from 'react';
import api from '../services/api';
import Header from '../components/Header';

export default function Dashboard() {
  const [saldos, setSaldos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filiais, setFiliais] = useState([]);
  const [filialSelecionada, setFilialSelecionada] = useState('');
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const ehGestor = usuario.filial_id === 'gestor';


  useEffect(() => {
    api.get('/saldos').then(res => {
      let dados = res.data;
      if (usuario.filial_id !== 'gestor') {
        dados = dados.filter(s => s.filial_id === usuario.filial_id);
      }
      setSaldos(dados);
      api.get('/filiais').then(res => setFiliais(res.data));
      setLoading(false);
    });
  }, []);

  const saldosFiltrados = filialSelecionada
    ? saldos.filter(s => s.filial_id === filialSelecionada)
    : saldos;

  const criticos = saldosFiltrados.filter(s => s.status === 'critico');
  const ok = saldosFiltrados.filter(s => s.status === 'ok');

  return (
    <>
      <Header />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 16px' }}>
        <h2>Dashboard de Estoque</h2>
              {ehGestor && (
        <div style={{ marginBottom: '24px', marginTop: '16px' }}>
          <label style={{ fontSize: '14px', fontWeight: '500', color: '#436eb3', marginRight: '8px' }}>Filtrar por filial:</label>
          <select
            value={filialSelecionada}
            onChange={(e) => setFilialSelecionada(e.target.value)}
            style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
          >
            <option value="">Todas as filiais</option>
            {filiais.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>
      )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', marginTop: '16px' }}>
          <div style={{ flex: 1, padding: '20px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <p style={{ fontSize: '13px', color: '#15803d', marginBottom: '4px' }}>Itens em estoque normal</p>
            <p style={{ fontSize: '28px', fontWeight: '500', color: '#15803d' }}>{ok.length}</p>
          </div>
          <div style={{ flex: 1, padding: '20px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '4px' }}>Itens em estado crítico</p>
            <p style={{ fontSize: '28px', fontWeight: '500', color: '#dc2626' }}>{criticos.length}</p>
          </div>
        </div>

        {criticos.length > 0 && (
          <>
            <h3 style={{ color: '#dc2626', marginBottom: '12px' }}>⚠ Atenção — Estoque crítico</h3>
            <div style={{ overflowX: 'auto', maxWidth: '100%', marginBottom: '32px' }}>
            <table style={{ minWidth: '600px', borderCollapse: 'collapse', marginBottom: '32px' }}>
              <thead>
                <tr style={{ background: '#fef2f2' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #fecaca' }}>Filial</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #fecaca' }}>Insumo</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #fecaca' }}>Unidade</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #fecaca' }}>Saldo</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #fecaca' }}>Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {criticos.map((s, i) => (
                  <tr key={i}>
                    <td style={{ padding: '8px', border: '1px solid #fecaca' }}>{s.filial_nome}</td>
                    <td style={{ padding: '8px', border: '1px solid #fecaca' }}>{s.insumo_nome}</td>
                    <td style={{ padding: '8px', border: '1px solid #fecaca' }}>{s.insumo_unidade}</td>
                    <td style={{ padding: '8px', border: '1px solid #fecaca', color: '#dc2626', fontWeight: '500' }}>{s.saldo}</td>
                    <td style={{ padding: '8px', border: '1px solid #fecaca' }}>{s.estoque_minimo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}

        <h3 style={{ marginBottom: '12px' }}>Estoque atual</h3>
        {loading && <p>Carregando...</p>}
        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Filial</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Insumo</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Unidade</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Saldo</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Mínimo</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {saldosFiltrados.length === 0 && !loading && (
              <tr><td colSpan="6" style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>Nenhum dado encontrado</td></tr>
            )}
            {saldosFiltrados.map((s, i) => (
              <tr key={i} style={{ background: s.status === 'critico' ? '#fef2f2' : 'white' }}>
                <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{s.filial_nome}</td>
                <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{s.insumo_nome}</td>
                <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{s.insumo_unidade}</td>
                <td style={{ padding: '8px', border: '1px solid #e5e7eb', fontWeight: '500', color: s.status === 'critico' ? '#dc2626' : '#15803d' }}>{s.saldo}</td>
                <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{s.estoque_minimo}</td>
                <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '12px', background: s.status === 'critico' ? '#fecaca' : '#bbf7d0', color: s.status === 'critico' ? '#dc2626' : '#15803d' }}>
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