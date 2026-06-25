import { useState, useEffect } from 'react';
import api from '../services/api';
import Header from '../components/Header';

export default function Relatorio() {
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [filiais, setFiliais] = useState([]);
    const [filtros, setFiltros] = useState({ filial: '', insumo_id: '', tipo: '', data_inicio: '', data_fim: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/insumos').then(res => setInsumos(res.data));
        api.get('/filiais').then(res => setFiliais(res.data));
        buscar();
    }, []);

    const buscar = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([k, v]) => { if (v) params.append(k, v); });
        const res = await api.get(`/movimentacoes?${params.toString()}`);
        setMovimentacoes(res.data);
        setLoading(false);
    };

    const handleFiltro = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

    const nomeFilia = (id) => filiais.find(f => f.id === id)?.nome || id;
    const nomeInsumo = (id) => insumos.find(i => i.id === id)?.nome || id;

    const exportarCSV = () => {
        const headers = ['Data', 'Tipo', 'Insumo', 'Origem', 'Destino', 'Quantidade'];
        const linhas = movimentacoes.map(m => [
            new Date(m.data).toLocaleString('pt-BR'),
            m.tipo,
            nomeInsumo(m.insumo_id),
            nomeFilia(m.filial_origem),
            nomeFilia(m.filial_destino),
            m.quantidade,
        ]);

        const csv = [headers, ...linhas].map(row => row.join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `movimentacoes_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <>
            <Header />
            <div style={{ maxWidth: '900px', margin: '40px auto', padding: '32px' }}>
                <h2>Relatório de Movimentações</h2>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', marginTop: '16px' }}>
                    <select name="filial" value={filtros.filial} onChange={handleFiltro} style={{ padding: '8px' }}>
                        <option value="">Todas as filiais</option>
                        {filiais.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>

                    <select name="insumo_id" value={filtros.insumo_id} onChange={handleFiltro} style={{ padding: '8px' }}>
                        <option value="">Todos os insumos</option>
                        {insumos.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                    </select>

                    <select name="tipo" value={filtros.tipo} onChange={handleFiltro} style={{ padding: '8px' }}>
                        <option value="">Todos os tipos</option>
                        <option value="entrada">Entrada</option>
                        <option value="saida">Saída</option>
                    </select>

                    <input type="date" name="data_inicio" value={filtros.data_inicio} onChange={handleFiltro} style={{ padding: '8px' }} />
                    <input type="date" name="data_fim" value={filtros.data_fim} onChange={handleFiltro} style={{ padding: '8px' }} />

                    <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
                    <button onClick={buscar} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        Filtrar
                    </button>
                    <button onClick={exportarCSV} style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        Exportar CSV
                    </button>
                    </div>
                </div>

                {loading && <p>Carregando...</p>}

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f3f4f6' }}>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Data</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Tipo</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Insumo</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Origem</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Destino</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Qtd</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movimentacoes.length === 0 && !loading && (
                            <tr><td colSpan="6" style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>Nenhuma movimentação encontrada</td></tr>
                        )}
                        {movimentacoes.map(m => (
                            <tr key={m.id}>
                                <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{new Date(m.data).toLocaleString('pt-BR')}</td>
                                <td style={{ padding: '8px', border: '1px solid #e5e7eb', color: m.tipo === 'entrada' ? 'green' : 'red' }}>{m.tipo}</td>
                                <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{nomeInsumo(m.insumo_id)}</td>
                                <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{nomeFilia(m.filial_origem)}</td>
                                <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{nomeFilia(m.filial_destino)}</td>
                                <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{m.quantidade}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}