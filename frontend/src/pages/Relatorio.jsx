import { useState, useEffect } from 'react';
import api from '../services/api';
import Header from '../components/Header';

export default function Relatorio() {
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [filiais, setFiliais] = useState([]);
    const [filtros, setFiltros] = useState({ filial: '', insumo_id: '', tipo: '', data_inicio: '', data_fim: '' });
    const [loading, setLoading] = useState(false);

    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const ehGestor = usuario?.filial_id === 'gestor';

    useEffect(() => {
        api.get('/insumos').then(res => setInsumos(res.data));
        api.get('/filiais').then(res => setFiliais(res.data));
        api.get('/auth/usuarios').then(res => setUsuarios(res.data));
        buscar();
    }, []);

    const buscar = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        const filtrosFinais = { ...filtros };
        if (!ehGestor) {
            filtrosFinais.filial = usuario.filial_id;
        }
        Object.entries(filtrosFinais).forEach(([k, v]) => { if (v) params.append(k, v); });
        const res = await api.get(`/movimentacoes?${params.toString()}`);
        setMovimentacoes(res.data);
        setLoading(false);
    };

    const handleFiltro = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

    const nomeFilia = (id) => filiais.find(f => f.id === id)?.nome || id;
    const nomeInsumo = (id) => insumos.find(i => i.id === id)?.nome || id;
    const nomeResponsavel = (id) => usuarios.find(u => u.id === id)?.nome || id;

    const exportarCSV = () => {
        const headers = ['Data', 'Tipo', 'Insumo', 'Origem', 'Destino', 'Quantidade', 'Nota Fiscal', 'Responsável'];
        const linhas = movimentacoes.map(m => [
            new Date(m.data).toLocaleString('pt-BR'),
            m.tipo,
            nomeInsumo(m.insumo_id),
            nomeFilia(m.filial_origem),
            nomeFilia(m.filial_destino),
            m.quantidade,
            m.nota_fiscal || '',
            nomeResponsavel(m.responsavel_id),
        ]);
        const csv = [headers, ...linhas].map(row => row.join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `movimentacoes_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const filterStyle = { padding: '9px', background: 'var(--cor-superficie-2)', border: '1px solid var(--cor-borda)', borderRadius: '6px', fontSize: '14px', color: 'var(--cor-texto)' };
    const thStyle = { padding: '10px', textAlign: 'left', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto-suave)', fontSize: '13px', fontWeight: '500' };
    const tdStyle = { padding: '10px', border: '1px solid var(--cor-borda)' };

    return (
        <>
            <Header />
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 16px' }}>
                <h2 style={{ color: 'var(--cor-texto-titulo)' }}>Relatório de Movimentações</h2>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', marginTop: '16px', alignItems: 'center' }}>
                    {ehGestor && (
                        <select name="filial" value={filtros.filial} onChange={handleFiltro} style={filterStyle}>
                            <option value="">Todas as filiais</option>
                            {filiais.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                        </select>
                    )}

                    <select name="insumo_id" value={filtros.insumo_id} onChange={handleFiltro} style={filterStyle}>
                        <option value="">Todos os insumos</option>
                        {insumos.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                    </select>

                    <select name="tipo" value={filtros.tipo} onChange={handleFiltro} style={filterStyle}>
                        <option value="">Todos os tipos</option>
                        <option value="entrada">Entrada</option>
                        <option value="saida">Saída</option>
                    </select>

                    <input type="date" name="data_inicio" value={filtros.data_inicio} onChange={handleFiltro} style={filterStyle} />
                    <input type="date" name="data_fim" value={filtros.data_fim} onChange={handleFiltro} style={filterStyle} />

                    <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
                        <button
                            onClick={buscar}
                            style={{ padding: '9px 18px', background: 'var(--cor-destaque)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'background 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cor-destaque-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--cor-destaque)'}
                        >
                            Filtrar
                        </button>
                        <button
                            onClick={exportarCSV}
                            style={{ padding: '9px 18px', background: 'transparent', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'border-color 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--cor-destaque)'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--cor-borda)'}
                        >
                            Exportar CSV
                        </button>
                    </div>
                </div>

                {loading && <p style={{ color: 'var(--cor-texto-suave)' }}>Carregando...</p>}
                <div style={{ overflowX: 'auto', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ minWidth: '800px', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--cor-superficie-2)' }}>
                                <th style={thStyle}>Data</th>
                                <th style={thStyle}>Tipo</th>
                                <th style={thStyle}>Insumo</th>
                                <th style={thStyle}>Origem</th>
                                <th style={thStyle}>Destino</th>
                                <th style={thStyle}>Qtd</th>
                                <th style={thStyle}>NF</th>
                                <th style={thStyle}>Responsável</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movimentacoes.length === 0 && !loading && (
                                <tr><td colSpan="8" style={{ padding: '16px', textAlign: 'center', color: 'var(--cor-texto-suave)' }}>Nenhuma movimentação encontrada</td></tr>
                            )}
                            {movimentacoes.map(m => (
                                <tr key={m.id}>
                                    <td style={tdStyle}>{new Date(m.data).toLocaleString('pt-BR')}</td>
                                    <td style={{ ...tdStyle, color: m.tipo === 'entrada' ? 'var(--cor-sucesso)' : 'var(--cor-perigo)' }}>{m.tipo}</td>
                                    <td style={tdStyle}>{nomeInsumo(m.insumo_id)}</td>
                                    <td style={tdStyle}>{nomeFilia(m.filial_origem)}</td>
                                    <td style={tdStyle}>{nomeFilia(m.filial_destino)}</td>
                                    <td style={tdStyle}>{m.quantidade}</td>
                                    <td style={tdStyle}>{m.nota_fiscal || '—'}</td>
                                    <td style={tdStyle}>{nomeResponsavel(m.responsavel_id)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}