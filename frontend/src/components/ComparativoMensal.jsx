import { useState, useMemo, useCallback, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { CalendarDays } from 'lucide-react';
import SeletorInsumo from './SeletorInsumo';
import { classificarMovimento } from '../utils/classificarMovimento';

export default function ComparativoMensal({
    movimentacoes,
    insumos,
    filiais,
    usuarios,
    ehGestor,
    mes,
    ano,
    setMes,
    setAno,
    loading,
    onBuscar
}) {

    const [categoria, setCategoria] = useState('');
    const [insumoId, setInsumoId] = useState('');
    const [filialId, setFilialId] = useState('');
    const [responsavelId, setResponsavelId] = useState('');


    const diasNoMes = new Date(ano, mes, 0).getDate();

    const dadosPorDia = useMemo(() => {
        const totais = Array(diasNoMes).fill(0);

        movimentacoes.forEach((m) => {
            const data = new Date(m.data);
            if (data.getFullYear() !== ano || data.getMonth() + 1 !== mes) return;
            if (categoria && classificarMovimento(m) !== categoria) return;
            if (insumoId && m.insumo_id !== insumoId) return;
            if (filialId && m.filial_origem !== filialId && m.filial_destino !== filialId) return;
            if (responsavelId && m.responsavel_id !== responsavelId) return;

            const dia = data.getDate();
            totais[dia - 1] += parseFloat(m.quantidade || 0);
        });

        return totais;
    }, [movimentacoes, ano, mes, categoria, insumoId, filialId, responsavelId, diasNoMes]);

    const totalMes = dadosPorDia.reduce((a, b) => a + b, 0);

    const dadosGrafico = {
        labels: Array.from({ length: diasNoMes }, (_, i) => String(i + 1)),
        datasets: [
            {
                label: { consumo: 'Consumo', transferencia: 'Transferências', entrada: 'Entradas' }[categoria] || 'Movimentação',
                data: dadosPorDia,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 3,
            },
        ],
    };

    const filterStyle = {
        padding: '9px',
        background: 'var(--cor-superficie-2)',
        border: '1px solid var(--cor-borda)',
        borderRadius: '6px',
        fontSize: '14px',
        color: 'var(--cor-texto)',
    };

    const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    return (
        <div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
                <select value={mes} onChange={(e) => { setMes(Number(e.target.value)); onBuscar(); }} style={filterStyle}>
                    {nomesMeses.map((nome, i) => (
                        <option key={i} value={i + 1}>{nome}</option>
                    ))}
                </select>

                <select value={ano} onChange={(e) => { setAno(Number(e.target.value)); onBuscar(); }} style={filterStyle}>
                    {Array.from({ length: 10 }, (_, i) => 2020 + i).map((a) => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </select>

                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={filterStyle}>
                    <option value="">Todas as movimentações</option>
                    <option value="consumo">Apenas Consumo</option>
                    <option value="transferencia">Apenas Transferências</option>
                    <option value="entrada">Apenas Entradas</option>
                </select>

                <SeletorInsumo
                    insumos={insumos}
                    valor={insumoId}
                    onChange={setInsumoId}
                    placeholder="Todos os insumos"
                />

                {ehGestor && (
                    <select value={filialId} onChange={(e) => setFilialId(e.target.value)} style={filterStyle}>
                        <option value="">Todas as filiais</option>
                        {filiais.map((f) => (
                            <option key={f.id} value={f.id}>{f.nome}</option>
                        ))}
                    </select>
                )}

                <select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)} style={filterStyle}>
                    <option value="">Todos os responsáveis</option>
                    {usuarios.map((u) => (
                        <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                </select>
            </div>

            <div style={{
                background: 'var(--cor-superficie)',
                border: '1px solid var(--cor-borda)',
                borderRadius: '12px',
                padding: '24px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ color: 'var(--cor-texto-titulo)', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <CalendarDays size={18} />
                        {nomesMeses[mes - 1]} de {ano}
                    </h3>
                    <span style={{ fontSize: '13px', color: 'var(--cor-texto-suave)' }}>
                        Total do mês: <strong style={{ color: 'var(--cor-texto-titulo)' }}>{totalMes}</strong>
                    </span>
                </div>

                {totalMes === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--cor-texto-suave)', padding: '32px 0' }}>
                        Nenhuma movimentação encontrada para este período e filtros.
                    </p>
                ) : (
                    <div style={{ height: '320px' }}>
                        <Bar
                            data={dadosGrafico}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        callbacks: {
                                            title: (items) => `Dia ${items[0].label}`,
                                            label: (context) => `${context.parsed.y} unidades`,
                                        },
                                    },
                                },
                                scales: {
                                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                                    x: { grid: { display: false } },
                                },
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}