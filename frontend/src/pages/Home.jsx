import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';

export default function Home() {
    const [filiais, setFiliais] = useState([]);
    const [saldos, setSaldos] = useState([]);
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const navigate = useNavigate();
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const ehGestor = usuario?.filial_id === 'gestor';

    useEffect(() => {
        api.get('/filiais').then(res => setFiliais(res.data));
        api.get('/saldos').then(res => setSaldos(res.data));
        api.get('/insumos').then(res => setInsumos(res.data));
        api.get('/movimentacoes').then(res => setMovimentacoes(res.data));
    }, []);

    const criticos = saldos.filter(s => s.status === 'critico').length;
    const ultimasMovimentacoes = [...movimentacoes].reverse().slice(0, 5);

    const atalhos = [
        { nome: 'Registrar Entrada', rota: '/entrada', cor: '#2563eb' },
        { nome: 'Registrar Saída', rota: '/saida', cor: '#dc2626' },
        { nome: 'Dashboard', rota: '/dashboard', cor: '#16a34a' },
        { nome: 'Relatório', rota: '/relatorio', cor: '#9333ea' },
    ];

    if (ehGestor) {
        atalhos.push(
            { nome: 'Painel de GAPs', rota: '/gaps', cor: '#d97706' },
            { nome: 'Painel do Gestor', rota: '/gestor', cor: '#0891b2' },
        );
    }

    return (
        <>
            <Header />
            <div style={{ maxWidth: '900px', margin: '40px auto', padding: '32px' }}>
                <h2>Bem-vindo, {usuario?.nome}!</h2>

                <div style={{ display: 'flex', gap: '16px', marginTop: '24px', marginBottom: '32px' }}>
                    <div style={{ flex: 1, padding: '20px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                        <p style={{ fontSize: '13px', color: '#1d4ed8', marginBottom: '4px' }}>Filiais cadastradas</p>
                        <p style={{ fontSize: '28px', fontWeight: '500', color: '#1d4ed8' }}>{filiais.length}</p>
                    </div>
                    <div style={{ flex: 1, padding: '20px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <p style={{ fontSize: '13px', color: '#15803d', marginBottom: '4px' }}>Movimentações registradas</p>
                        <p style={{ fontSize: '28px', fontWeight: '500', color: '#15803d' }}>{movimentacoes.length}</p>
                    </div>
                    <div style={{ flex: 1, padding: '20px', background: criticos > 0 ? '#fef2f2' : '#f0fdf4', borderRadius: '8px', border: `1px solid ${criticos > 0 ? '#fecaca' : '#bbf7d0'}` }}>
                        <p style={{ fontSize: '13px', color: criticos > 0 ? '#dc2626' : '#15803d', marginBottom: '4px' }}>Itens críticos</p>
                        <p style={{ fontSize: '28px', fontWeight: '500', color: criticos > 0 ? '#dc2626' : '#15803d' }}>{criticos}</p>
                    </div>
                </div>

                <h3 style={{ marginBottom: '16px' }}>Acesso rápido</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                    {atalhos.map(a => (
                        <button
                            key={a.rota}
                            onClick={() => navigate(a.rota)}
                            style={{ padding: '24px 16px', background: 'white', border: `2px solid ${a.cor}`, borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '500', color: a.cor }}
                        >
                            {a.nome}
                        </button>
                    ))}
                </div>
                <h3 style={{ marginBottom: '16px' }}>Últimas movimentações</h3>
<table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
  <thead>
    <tr style={{ background: '#f3f4f6' }}>
      <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Data</th>
      <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Tipo</th>
      <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Qtd</th>
    </tr>
  </thead>
  <tbody>
    {ultimasMovimentacoes.map(m => (
      <tr key={m.id}>
        <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{new Date(m.data).toLocaleString('pt-BR')}</td>
        <td style={{ padding: '8px', border: '1px solid #e5e7eb', color: m.tipo === 'entrada' ? 'green' : 'red' }}>{m.tipo}</td>
        <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{m.quantidade}</td>
      </tr>
    ))}
  </tbody>
</table>
                {ehGestor && filiais.length > 0 && (
                    <>
                        <h3 style={{ marginBottom: '16px' }}>Filiais</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                            {filiais.map(f => (
                                <div
                                    key={f.id}
                                    style={{ padding: '20px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                >
                                    <p style={{ fontWeight: '500', fontSize: '15px', marginBottom: '4px' }}>{f.nome}</p>
                                    <p style={{ fontSize: '13px', color: '#6b7280' }}>{f.responsavel}</p>
                                </div>
                            ))}
                            <div style={{ flex: 1, padding: '20px', background: '#faf5ff', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                                <p style={{ fontSize: '13px', color: '#7e22ce', marginBottom: '4px' }}>Insumos cadastrados</p>
                                <p style={{ fontSize: '28px', fontWeight: '500', color: '#7e22ce' }}>{insumos.length}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}