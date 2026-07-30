import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import Header from '../components/Header';
import { GitBranch, CheckCircle, AlertTriangle, AlertCircle, TrendingUp, Users } from 'lucide-react';

export default function PainelGaps() {
  const [saldos, setSaldos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [filiais, setFiliais] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/saldos'),
      api.get('/movimentacoes'),
      api.get('/filiais'),
    ]).then(([saldosRes, movRes, filiaisRes]) => {
      setSaldos(saldosRes.data);
      setMovimentacoes(movRes.data);
      setFiliais(filiaisRes.data);
      setLoading(false);
    });
  }, []);

  const saldosNegativos = saldos.filter(s => s.saldo < 0);

  const consumoPorFilial = {};
  movimentacoes.filter(m => m.tipo === 'saida').forEach(m => {
    const filial = m.filial_origem;
    if (!consumoPorFilial[filial]) consumoPorFilial[filial] = 0;
    consumoPorFilial[filial] += parseFloat(m.quantidade) || 0;
  });

  const totalFiliais = Object.keys(consumoPorFilial).length;
  const totalConsumo = Object.values(consumoPorFilial).reduce((a, b) => a + b, 0);
  const mediaConsumo = totalFiliais > 0 ? totalConsumo / totalFiliais : 0;
  const filiaisAnomelas = Object.entries(consumoPorFilial)
    .filter(([id, qtd]) => id !== '1' && qtd > mediaConsumo * 2)
    .map(([filial_id, qtd]) => {
      const filial = filiais.find(f => f.id === filial_id);
      return { filial_nome: filial ? filial.nome : filial_id, consumo: qtd, media: mediaConsumo };
    });

  const seteDiasAtras = useMemo(() => {
    const dataBase = new Date();
    dataBase.setDate(dataBase.getDate() - 7);
    return dataBase;
  }, []);

  const filiaisComMovimentacao = useMemo(() => new Set(
    movimentacoes
      .filter(m => new Date(m.data) >= seteDiasAtras)
      .map(m => m.filial_origem)
  ), [movimentacoes, seteDiasAtras]);
  const filiaisSemMovimentacao = filiais.filter(f => !filiaisComMovimentacao.has(f.id));

  const totalGaps = saldosNegativos.length + filiaisAnomelas.length + filiaisSemMovimentacao.length;

  const tabelaStyles = (cor) => ({
    th: { padding: '10px', textAlign: 'left', border: `1px solid ${cor}`, color: 'var(--cor-texto-suave)', fontSize: '13px', fontWeight: '500' },
    td: { padding: '10px', border: `1px solid ${cor}` },
  });
  const sPerigo = tabelaStyles('var(--cor-perigo)');
  const sAlerta = tabelaStyles('var(--cor-alerta)');
  const sNeutro = tabelaStyles('var(--cor-borda)');
  const descStyle = { fontSize: '13px', color: 'var(--cor-texto-suave)', marginBottom: '12px' };
  const wrapTabela = { overflowX: 'auto', maxWidth: '100%' };

  return (
    <>
      <Header />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 16px' }}>
        <h2 style={{ color: 'var(--cor-texto-titulo)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitBranch size={24} />
          Painel de GAPs
        </h2>
        <p style={{ color: 'var(--cor-texto-suave)', marginBottom: '24px' }}>Inconsistências e anomalias detectadas automaticamente</p>

        <div style={{
          padding: '16px 20px',
          background: totalGaps === 0 ? 'var(--cor-sucesso-bg)' : 'var(--cor-perigo-bg)',
          border: `1px solid ${totalGaps === 0 ? 'var(--cor-sucesso)' : 'var(--cor-perigo)'}`,
          borderRadius: '12px',
          marginBottom: '32px'
        }}>
          <p style={{
            fontWeight: '500',
            color: totalGaps === 0 ? 'var(--cor-sucesso)' : 'var(--cor-perigo)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {totalGaps === 0 ? (
              <>
                <CheckCircle size={18} />
                Nenhum GAP detectado — tudo em ordem!
              </>
            ) : (
              <>
                <AlertTriangle size={18} />
                {totalGaps} GAP(s) detectado(s) — ação necessária
              </>
            )}
          </p>
        </div>

        {saldosNegativos.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: 'var(--cor-perigo)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={18} />
              Saldos negativos
            </h3>
            <p style={descStyle}>Saiu mais do que entrou — fisicamente impossível. Verifique os registros.</p>
            <div style={wrapTabela}>
              <table style={{ width: '100%', minWidth: '480px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--cor-perigo-bg)' }}>
                    <th style={sPerigo.th}>Filial</th>
                    <th style={sPerigo.th}>Insumo</th>
                    <th style={sPerigo.th}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {saldosNegativos.map((s, i) => (
                    <tr key={i}>
                      <td style={sPerigo.td}>{s.filial_nome}</td>
                      <td style={sPerigo.td}>{s.insumo_nome}</td>
                      <td style={{ ...sPerigo.td, color: 'var(--cor-perigo)', fontWeight: '500' }}>{s.saldo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filiaisAnomelas.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: 'var(--cor-alerta)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={18} />
              Consumo anômalo
            </h3>
            <p style={descStyle}>Filiais consumindo mais que o dobro da média geral.</p>
            <div style={wrapTabela}>
              <table style={{ width: '100%', minWidth: '480px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--cor-alerta-bg)' }}>
                    <th style={sAlerta.th}>Filial</th>
                    <th style={sAlerta.th}>Consumo total</th>
                    <th style={sAlerta.th}>Média geral</th>
                  </tr>
                </thead>
                <tbody>
                  {filiaisAnomelas.map((f, i) => (
                    <tr key={i}>
                      <td style={sAlerta.td}>{f.filial_nome}</td>
                      <td style={{ ...sAlerta.td, color: 'var(--cor-alerta)', fontWeight: '500' }}>{f.consumo}</td>
                      <td style={sAlerta.td}>{mediaConsumo.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filiaisSemMovimentacao.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: 'var(--cor-texto-titulo)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={18} />
              Filiais sem movimentação nos últimos 7 dias
            </h3>
            <p style={descStyle}>Pode indicar que a filial não está registrando ou está inativa.</p>
            <div style={wrapTabela}>
              <table style={{ width: '100%', minWidth: '420px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--cor-superficie-2)' }}>
                    <th style={sNeutro.th}>Filial</th>
                    <th style={sNeutro.th}>Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {filiaisSemMovimentacao.map((f, i) => (
                    <tr key={i}>
                      <td style={sNeutro.td}>{f.nome}</td>
                      <td style={sNeutro.td}>{f.responsavel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && totalGaps === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--cor-texto-suave)', marginTop: '32px' }}>
            <CheckCircle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Nenhuma anomalia encontrada no momento.
          </p>
        )}
      </div>
    </>
  );
}