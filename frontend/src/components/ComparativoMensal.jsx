import { useState, useEffect, useMemo, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import SeletorInsumo from './SeletorInsumo';
import { classificarMovimento } from '../utils/classificarMovimento';
import {
    Download,
    TrendingUp,
    AlertCircle,
    ChartColumn,
    CalendarDays,
    LayoutGrid,
    Trash2
} from 'lucide-react';

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
}) {

    const [categoria, setCategoria] = useState('');
    const [insumoId, setInsumoId] = useState('');
    const [filialId, setFilialId] = useState('');
    const [responsavelId, setResponsavelId] = useState('');
    const [diasSelecionados, setDiasSelecionados] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const diasNoMes = new Date(ano, mes, 0).getDate();

    const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const movimentacoesFiltradas = useMemo(() => {
        return movimentacoes.filter((m) => {
            const data = new Date(m.data);
            if (data.getFullYear() !== ano || data.getMonth() + 1 !== mes) return false;
            if (categoria && classificarMovimento(m) !== categoria) return false;
            if (insumoId && m.insumo_id !== insumoId) return false;
            if (filialId && m.filial_origem !== filialId && m.filial_destino !== filialId) return false;
            if (responsavelId && m.responsavel_id !== responsavelId) return false;
            return true;
        });
    }, [movimentacoes, ano, mes, categoria, insumoId, filialId, responsavelId]);

    const dadosPorDia = useMemo(() => {
        const totais = Array(diasNoMes).fill(0);

        movimentacoesFiltradas.forEach((m) => {
            const dia = new Date(m.data).getDate();
            totais[dia - 1] += parseFloat(m.quantidade || 0);
        });

        return totais;
    }, [movimentacoesFiltradas, diasNoMes]);

    const totaisSemanais = useMemo(() => {
        const semanas = [];
        for (let i = 0; i < dadosPorDia.length; i += 7) {
            const semana = dadosPorDia.slice(i, i + 7);
            const total = semana.reduce((a, b) => a + b, 0);
            const dias = semana.filter(d => d > 0).length;
            semanas.push({
                numero: Math.floor(i / 7) + 1,
                total,
                dias,
                media: dias > 0 ? Math.round(total / dias) : 0,
                diasRange: `${i + 1} - ${Math.min(i + 7, dadosPorDia.length)}`
            });
        }
        return semanas;
    }, [dadosPorDia]);

    const mediaGeral = useMemo(() => {
        if (totaisSemanais.length === 0) return 0;
        const total = totaisSemanais.reduce((acc, s) => acc + s.total, 0);
        return total / totaisSemanais.length;
    }, [totaisSemanais]);

    const totalMes = dadosPorDia.reduce((a, b) => a + b, 0);

    const nomeInsumo = (id) => insumos.find(i => i.id === id)?.nome || id;

    const diasDoMesComDados = useMemo(() => {
        const mapa = {};

        movimentacoesFiltradas.forEach((m) => {
            const dia = new Date(m.data).getDate();
            if (!mapa[dia]) mapa[dia] = {};
            const nome = nomeInsumo(m.insumo_id);
            mapa[dia][nome] = (mapa[dia][nome] || 0) + parseFloat(m.quantidade || 0);
        });

        return Object.entries(mapa)
            .map(([dia, insumos]) => ({
                dia: parseInt(dia),
                insumos: Object.entries(insumos)
                    .map(([nome, total]) => ({ nome, total }))
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5) // top 5 insumos
            }))
            .sort((a, b) => a.dia - b.dia);
    }, [movimentacoesFiltradas]);

    const exportarCSVComparativo = () => {
        const headers = ['Dia', 'Quantidade', 'Insumos (top 5)'];
        const linhas = diasDoMesComDados.map((d) => [
            d.dia,
            dadosPorDia[d.dia - 1] || 0,
            d.insumos.map((i) => `${i.nome} (${i.total})`).join('; ')
        ]);
        const csv = [headers, ...linhas].map((row) => row.join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `comparativo_${nomesMeses[mes - 1]}_${ano}.csv`;
        link.click();
    };

    const cores = {
        consumo: { bg: 'rgba(220, 38, 38, 0.6)', border: 'rgba(220, 38, 38, 1)' },
        transferencia: { bg: 'rgba(245, 158, 11, 0.6)', border: 'rgba(245, 158, 11, 1)' },
        entrada: { bg: 'rgba(34, 197, 94, 0.6)', border: 'rgba(34, 197, 94, 1)' },
    };
    const corAtual = cores[categoria] || { bg: 'rgba(59, 130, 246, 0.6)', border: 'rgba(59, 130, 246, 1)' };

    const coresDias = useMemo(() => {
        const paleta = [
            'var(--cor-destaque)',
            'var(--cor-alerta)',
            'var(--cor-sucesso)',
            '#8b5cf6', // roxo
            '#ec4899', // rosa
            '#14b8a6', // teal
            '#f97316', // laranja
            '#6366f1', // índigo
            '#84cc16', // lima
            '#06b6d4', // ciano
        ];

        const mapa = {};
        diasSelecionados.forEach((dia, index) => {
            mapa[dia] = paleta[index % paleta.length];
        });
        return mapa;
    }, [diasSelecionados]);

    const dadosGrafico = {
        labels: Array.from({ length: diasNoMes }, (_, i) => String(i + 1)),
        datasets: [
            {
                label: { consumo: 'Consumo', transferencia: 'Transferências', entrada: 'Entradas' }[categoria] || 'Movimentação',
                data: dadosPorDia,
                backgroundColor: corAtual.bg,
                borderColor: corAtual.border,
                borderWidth: 1,
                borderRadius: 3,
            },
        ],
    };

    const chartRef = useRef(null);

    const handleChartClick = (event) => {
        const chart = chartRef.current;
        if (!chart) return;

        const elements = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true });
        if (elements.length === 0) return;

        const index = elements[0].index;
        const dia = index + 1;

        setDiasSelecionados(prev => {
            if (prev.includes(dia)) {
                return prev.filter(d => d !== dia);
            } else {
                return [...prev, dia];
            }
        });
    };

    const filterStyle = {
        padding: '9px',
        background: 'var(--cor-superficie-2)',
        border: '1px solid var(--cor-borda)',
        borderRadius: '6px',
        fontSize: '14px',
        color: 'var(--cor-texto)',
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    border: '4px solid var(--cor-borda)',
                    borderTop: '4px solid var(--cor-destaque)',
                    borderRadius: '50%',
                    margin: '0 auto 12px',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <p style={{ color: 'var(--cor-texto-suave)' }}>Carregando dados do mês...</p>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
                <select value={mes} onChange={(e) => { setMes(Number(e.target.value)); }} style={{ ...filterStyle, minWidth: isMobile ? '100%' : 'auto', flex: isMobile ? '1 1 100%' : '0 1 auto' }}>
                    {nomesMeses.map((nome, i) => (
                        <option key={i} value={i + 1}>{nome}</option>
                    ))}
                </select>

                <select value={ano} onChange={(e) => { setAno(Number(e.target.value)); }} style={{ ...filterStyle, minWidth: isMobile ? '100%' : 'auto', flex: isMobile ? '1 1 100%' : '0 1 auto' }}>
                    {Array.from({ length: 10 }, (_, i) => 2020 + i).map((a) => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </select>

                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{ ...filterStyle, minWidth: isMobile ? '100%' : 'auto', flex: isMobile ? '1 1 100%' : '0 1 auto' }}>
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
                    <select value={filialId} onChange={(e) => setFilialId(e.target.value)} style={{ ...filterStyle, minWidth: isMobile ? '100%' : 'auto', flex: isMobile ? '1 1 100%' : '0 1 auto' }}>
                        <option value="">Todas as filiais</option>
                        {filiais.map((f) => (
                            <option key={f.id} value={f.id}>{f.nome}</option>
                        ))}
                    </select>
                )}

                <select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)} style={{ ...filterStyle, minWidth: isMobile ? '100%' : 'auto', flex: isMobile ? '1 1 100%' : '0 1 auto' }}>
                    <option value="">Todos os responsáveis</option>
                    {usuarios.map((u) => (
                        <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                </select>
                <button
                    onClick={exportarCSVComparativo}
                    style={{
                        padding: "9px 18px",
                        background: "transparent",
                        color: "var(--cor-texto)",
                        border: "1px solid var(--cor-borda)",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--cor-destaque)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--cor-borda)")}
                >
                    <Download size={16} strokeWidth={1.5} color="var(--cor-texto)" />
                    Exportar CSV
                </button>
            </div>

            <div style={{
                background: 'var(--cor-superficie)',
                border: '1px solid var(--cor-borda)',
                borderRadius: '12px',
                padding: isMobile ? '16px' : '24px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ color: 'var(--cor-texto-titulo)', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <CalendarDays size={18} strokeWidth={1.5} color="var(--cor-texto-titulo)" />
                        {nomesMeses[mes - 1]} de {ano}
                    </h3>
                    <span style={{
                        background: 'var(--cor-superficie-2)',
                        padding: isMobile ? '4px 12px' : '6px 16px',
                        borderRadius: '8px',
                        fontSize: isMobile ? '12px' : '13px',
                        color: 'var(--cor-texto)',
                        border: '1px solid var(--cor-superficie-2)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}>
                        <TrendingUp size={14} strokeWidth={1.5} color="var(--cor-sucesso)" />
                        <span style={{ color: 'var(--cor-texto-suave)' }}>Total do mês:</span>
                        <strong style={{ color: 'var(--cor-sucesso)', fontSize: '16px' }}>{totalMes}</strong>
                    </span>
                </div>

                {totalMes === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <AlertCircle size={32} color="var(--cor-texto-suave)" />
                        <p style={{ color: 'var(--cor-texto-suave)' }}>
                            {categoria || insumoId || filialId || responsavelId
                                ? 'Nenhum resultado para os filtros selecionados. Tente ajustar os filtros.'
                                : 'Nenhuma movimentação encontrada para este período.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ height: isMobile ? '260px' : '320px' }}>
                        <Bar
                            ref={chartRef}
                            data={dadosGrafico}
                            onClick={handleChartClick}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        callbacks: {
                                            title: (items) => {
                                                const dia = items[0].label;
                                                return `${dia} de ${nomesMeses[mes - 1]} de ${ano}`;
                                            },
                                            label: (context) => {
                                                const valor = context.parsed.y;
                                                const total = dadosPorDia.reduce((a, b) => a + b, 0);
                                                return `${valor} unidades (${total > 0 ? Math.round((valor / total) * 100) : 0}%)`;
                                            },
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
                {diasSelecionados.length > 0 && (
                    <div style={{
                        marginTop: '16px',
                        borderTop: '1px solid var(--cor-borda)',
                        paddingTop: '16px',
                        animation: 'fadeIn 0.2s ease-in-out',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ color: 'var(--cor-texto-titulo)', fontSize: '14px', margin: 0 }}>
                                <ChartColumn size={16} strokeWidth={1.5} color="var(--cor-destaque)" /> Detalhes dos dias selecionados ({diasSelecionados.length})
                            </h4>
                            <button
                                onClick={() => setDiasSelecionados([])}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--cor-texto-suave)',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cor-superficie-2)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                                <Trash2 color="#1e9bd7" strokeWidth={1.5} />
                            </button>
                        </div>

                        {diasSelecionados.map(dia => {
                            const diaInfo = diasDoMesComDados.find(d => d.dia === dia);
                            if (!diaInfo || diaInfo.insumos.length === 0) {
                                return (
                                    <div key={dia} style={{ marginBottom: '12px' }}>
                                        <strong style={{ color: 'var(--cor-texto-titulo)' }}>Dia {dia}:</strong>
                                        <span style={{ color: 'var(--cor-texto-suave)', marginLeft: '8px' }}>Nenhum insumo</span>
                                    </div>
                                );
                            }
                            return (
                                <div key={dia} style={{
                                    background: 'var(--cor-superficie)',
                                    border: '1px solid var(--cor-borda)',
                                    borderRadius: '8px',
                                    padding: '12px 16px',
                                    marginBottom: '8px',
                                    transition: 'all 0.2s ease',
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '8px',
                                        marginBottom: '8px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{
                                                background: coresDias[dia] || 'var(--cor-destaque)',
                                                color: '#fff',
                                                padding: '2px 10px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                            }}>
                                                Dia {dia}
                                            </span>
                                            <span style={{
                                                fontSize: '13px',
                                                color: 'var(--cor-texto-titulo)',
                                                fontWeight: '500',
                                            }}>
                                                Total: <strong>{dadosPorDia[dia - 1] || 0}</strong> unidades
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setDiasSelecionados(prev => prev.filter(d => d !== dia))}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--cor-texto-suave)',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--cor-perigo-bg)';
                                                e.currentTarget.style.color = 'var(--cor-perigo)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.color = 'var(--cor-texto-suave)';
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {diaInfo.insumos.map((insumo, idx) => (
                                            <span key={idx} style={{
                                                background: 'var(--cor-superficie-2)',
                                                padding: '4px 12px',
                                                borderRadius: '16px',
                                                fontSize: '13px',
                                                color: 'var(--cor-texto)',
                                                border: '1px solid var(--cor-borda)',
                                                userSelect: 'none',
                                                WebkitUserSelect: 'none',
                                                MozUserSelect: 'none',
                                                msUserSelect: 'none',
                                                cursor: 'default',
                                                transition: 'all 0.2s ease',
                                            }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'var(--cor-superficie)';
                                                    e.currentTarget.style.borderColor = 'var(--cor-destaque)';
                                                    e.currentTarget.style.transform = 'scale(1.02)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'var(--cor-superficie-2)';
                                                    e.currentTarget.style.borderColor = 'var(--cor-borda)';
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}>
                                                {insumo.nome}: <strong>{insumo.total}</strong>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            {/* Totais semanais */}
            {dadosPorDia.some(d => d > 0) && (
                <div style={{
                    marginTop: '16px',
                    borderTop: '1px solid var(--cor-borda)',
                    paddingTop: '16px',
                }}>
                    <h4 style={{
                        color: 'var(--cor-texto-titulo)',
                        fontSize: '14px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}>
                        <LayoutGrid size={16} strokeWidth={1.5} color="var(--cor-texto-titulo)" />
                        Totais por Semana
                    </h4>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: isMobile ? '8px' : '12px',
                    }}>
                        {totaisSemanais.map((semana) => {
                            const isPico = semana.total === Math.max(...totaisSemanais.map(s => s.total));
                            const isAcimaDaMedia = semana.total > mediaGeral;

                            const corDestaque = isPico ? 'var(--cor-destaque)' : (isAcimaDaMedia ? 'var(--cor-alerta)' : 'var(--cor-texto-titulo)');
                            const bordaDestaque = isPico ? `2px solid var(--cor-destaque)` : (isAcimaDaMedia ? '1px solid var(--cor-alerta)' : '1px solid var(--cor-borda)');
                            const label = isPico ? '🏆 Pico' : (isAcimaDaMedia ? '⬆ Alta' : '');
                            const fundoDestaque = isPico || isAcimaDaMedia ? 'var(--cor-superficie)' : 'var(--cor-superficie-2)';

                            return (
                                <div key={semana.numero} style={{
                                    background: fundoDestaque, // ← estava isMax, agora usa fundoDestaque
                                    padding: isMobile ? '10px 12px' : '14px 16px',
                                    borderRadius: '10px',
                                    border: bordaDestaque,
                                    textAlign: 'center',
                                    transition: 'all 0.2s ease',
                                    cursor: 'default',
                                    position: 'relative',
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = 'var(--cor-sombra-hover)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}>
                                    {/* Badge "Pico" ou "Alta" */}
                                    {label && (
                                        <span style={{
                                            position: 'absolute',
                                            top: '-6px',
                                            right: '-6px',
                                            background: isPico ? 'var(--cor-destaque)' : 'var(--cor-alerta)',
                                            color: '#fff',
                                            fontSize: '9px',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                        }}>
                                            {label}
                                        </span>
                                    )}
                                    <div style={{
                                        fontSize: '11px',
                                        color: 'var(--cor-texto-suave)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                    }}>
                                        Semana {semana.numero}
                                    </div>
                                    <div style={{
                                        fontSize: '22px',
                                        fontWeight: '700',
                                        color: corDestaque,
                                        marginTop: '4px',
                                    }}>
                                        {semana.total}
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: 'var(--cor-texto-suave)',
                                        marginTop: '2px',
                                    }}>
                                        {semana.dias} {semana.dias === 1 ? 'dia' : 'dias'} • média {semana.media}
                                    </div>
                                    <div style={{
                                        fontSize: '10px',
                                        color: 'var(--cor-texto-suave)',
                                        marginTop: '2px',
                                        opacity: 0.7,
                                    }}>
                                        Dias {semana.diasRange}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}