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

    const nomeInsumo = (id) => {
        const insumo = insumos.find(i => i.id === id);
        return insumo ? insumo.nome : 'Insumo não encontrado';
    };

    const nomeFilial = (id) => {
        if (!id) return 'Não informado';
        const filial = filiais.find(f => f.id === id);
        return filial ? filial.nome : 'Fornecedor';
    };

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
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 16px' }}>
                <h2 style={{ color: 'var(--cor-texto-titulo)' }}>Bem-vindo, {usuario?.nome}!</h2>

                <div style={{ display: 'flex', gap: '16px', marginTop: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 160px', padding: '20px', background: 'var(--cor-superficie)', borderRadius: '12px', border: '1px solid var(--cor-borda)' }}>
                        <p style={{ fontSize: '13px', color: 'var(--cor-texto-suave)', margin: '0 0 6px' }}>Filiais cadastradas</p>
                        <p style={{ fontSize: '28px', fontWeight: '500', color: 'var(--cor-destaque)', margin: 0 }}>{filiais.length}</p>
                    </div>
                    <div style={{ flex: '1 1 160px', padding: '20px', background: 'var(--cor-superficie)', borderRadius: '12px', border: '1px solid var(--cor-borda)' }}>
                        <p style={{ fontSize: '13px', color: 'var(--cor-texto-suave)', margin: '0 0 6px' }}>Insumos cadastrados</p>
                        <p style={{ fontSize: '28px', fontWeight: '500', color: 'var(--cor-destaque)', margin: 0 }}>{insumos.length}</p>
                    </div>
                    <div style={{ flex: '1 1 160px', padding: '20px', background: 'var(--cor-superficie)', borderRadius: '12px', border: '1px solid var(--cor-borda)' }}>
                        <p style={{ fontSize: '13px', color: 'var(--cor-texto-suave)', margin: '0 0 6px' }}>Movimentações</p>
                        <p style={{ fontSize: '28px', fontWeight: '500', color: 'var(--cor-texto-titulo)', margin: 0 }}>{movimentacoes.length}</p>
                    </div>
                    <div style={{ flex: '1 1 160px', padding: '20px', background: criticos > 0 ? 'var(--cor-perigo-bg)' : 'var(--cor-sucesso-bg)', borderRadius: '12px', border: `1px solid ${criticos > 0 ? 'var(--cor-perigo)' : 'var(--cor-sucesso)'}` }}>
                        <p style={{ fontSize: '13px', color: 'var(--cor-texto-suave)', margin: '0 0 6px' }}>Itens críticos</p>
                        <p style={{ fontSize: '28px', fontWeight: '500', color: criticos > 0 ? 'var(--cor-perigo)' : 'var(--cor-sucesso)', margin: 0 }}>{criticos}</p>
                    </div>
                </div>

                <h3 style={{ marginBottom: '16px', color: 'var(--cor-texto-titulo)' }}>Acesso rápido</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '32px' }}>
                    {atalhos.map(a => (
                        <button
                            key={a.rota}
                            onClick={() => navigate(a.rota)}
                            style={{ padding: '20px 16px', background: 'var(--cor-superficie)', border: '1px solid var(--cor-borda)', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: 'var(--cor-texto)', transition: 'border-color 0.2s, background 0.2s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--cor-destaque)'; e.currentTarget.style.background = 'var(--cor-superficie-2)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--cor-borda)'; e.currentTarget.style.background = 'var(--cor-superficie)'; }}
                        >
                            {a.nome}
                        </button>
                    ))}
                </div>

                <h3 style={{ marginBottom: '16px', color: 'var(--cor-texto-titulo)' }}>Últimas movimentações</h3>
                <div style={{ overflowX: 'auto', maxWidth: '100%', marginBottom: '32px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--cor-superficie-2)' }}>
                                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto-suave)', fontSize: '13px' }}>Data</th>
                                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto-suave)', fontSize: '13px' }}>Insumo</th>
                                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto-suave)', fontSize: '13px' }}>Tipo</th>
                                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto-suave)', fontSize: '13px' }}>Origem</th>
                                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto-suave)', fontSize: '13px' }}>Destino</th>
                                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto-suave)', fontSize: '13px' }}>Qtd</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ultimasMovimentacoes.map(m => (
                                <tr key={m.id}>
                                    <td style={{ padding: '10px', border: '1px solid var(--cor-borda)' }}>{new Date(m.data).toLocaleString('pt-BR')}</td>
                                    <td style={{ padding: '10px', border: '1px solid var(--cor-borda)' }}>{nomeInsumo(m.insumo_id)}</td>
                                    <td style={{ padding: '10px', border: '1px solid var(--cor-borda)', color: m.tipo === 'entrada' ? 'var(--cor-sucesso)' : 'var(--cor-perigo)' }}>{m.tipo}</td>
                                    <td style={{ padding: '10px', border: '1px solid var(--cor-borda)' }}>{nomeFilial(m.filial_origem)}</td>
                                    <td style={{ padding: '10px', border: '1px solid var(--cor-borda)' }}>
                                        {m.tipo === 'saida' && m.filial_destino === ""
                                            ? `Consumo`
                                            : nomeFilial(m.filial_destino)}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid var(--cor-borda)' }}>{m.quantidade}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {ehGestor && filiais.length > 0 && (
                    <>
                        <h3 style={{ marginBottom: '16px', color: 'var(--cor-texto-titulo)' }}>Filiais</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                            {filiais.map(f => (
                                <div
                                    key={f.id}
                                    style={{ padding: '18px', background: 'var(--cor-superficie)', border: '1px solid var(--cor-borda)', borderRadius: '10px' }}
                                >
                                    <p style={{ fontWeight: '500', fontSize: '15px', margin: '0 0 4px', color: 'var(--cor-texto-titulo)' }}>{f.nome}</p>
                                    <p style={{ fontSize: '13px', color: 'var(--cor-texto-suave)', margin: 0 }}>{f.responsavel}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}