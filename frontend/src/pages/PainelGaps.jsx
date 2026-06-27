import { useState, useEffect } from 'react';
import api from '../services/api';
import Header from '../components/Header';

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
    .filter(([, qtd]) => qtd > mediaConsumo * 2)
    .map(([filial_id, qtd]) => {
      const filial = filiais.find(f => f.id === filial_id);
      return { filial_nome: filial ? filial.nome : filial_id, consumo: qtd, media: mediaConsumo };
    });

  const setesDias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const filiaisComMovimentacao = new Set(
    movimentacoes
      .filter(m => new Date(m.data) >= setesDias)
      .map(m => m.filial_origem)
  );
  const filiaisSemMovimentacao = filiais.filter(f => !filiaisComMovimentacao.has(f.id));

  const totalGaps = saldosNegativos.length + filiaisAnomelas.length + filiaisSemMovimentacao.length;

  return (
    <>
      <Header />
      <div style={{ maxWidth: '900px', margin: '40px auto', padding: '32px' }}>
        <h2>Painel de GAPs</h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>Inconsistências e anomalias detectadas automaticamente</p>

        <div style={{ padding: '16px 20px', background: totalGaps === 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${totalGaps === 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: '8px', marginBottom: '32px' }}>
          <p style={{ fontWeight: '500', color: totalGaps === 0 ? '#15803d' : '#dc2626' }}>
            {totalGaps === 0 ? '✓ Nenhum GAP detectado — tudo em ordem!' : `⚠ ${totalGaps} GAP(s) detectado(s) — ação necessária`}
          </p>
        </div>

        {saldosNegativos.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: '#dc2626', marginBottom: '12px' }}>Saldos negativos</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>Saiu mais do que entrou — fisicamente impossível. Verifique os registros.</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fef2f2' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #fecaca' }}>Filial</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #fecaca' }}>Insumo</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #fecaca' }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {saldosNegativos.map((s, i) => (
                  <tr key={i}>
                    <td style={{ padding: '8px', border: '1px solid #fecaca' }}>{s.filial_nome}</td>
                    <td style={{ padding: '8px', border: '1px solid #fecaca' }}>{s.insumo_nome}</td>
                    <td style={{ padding: '8px', border: '1px solid #fecaca', color: '#dc2626', fontWeight: '500' }}>{s.saldo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filiaisAnomelas.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: '#d97706', marginBottom: '12px' }}>Consumo anômalo</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>Filiais consumindo mais que o dobro da média geral.</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fffbeb' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #fde68a' }}>Filial</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #fde68a' }}>Consumo total</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #fde68a' }}>Média geral</th>
                </tr>
              </thead>
              <tbody>
                {filiaisAnomelas.map((f, i) => (
                  <tr key={i}>
                    <td style={{ padding: '8px', border: '1px solid #fde68a' }}>{f.filial_nome}</td>
                    <td style={{ padding: '8px', border: '1px solid #fde68a', color: '#d97706', fontWeight: '500' }}>{f.consumo}</td>
                    <td style={{ padding: '8px', border: '1px solid #fde68a' }}>{mediaConsumo.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filiaisSemMovimentacao.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: '#6b7280', marginBottom: '12px' }}>Filiais sem movimentação nos últimos 7 dias</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>Pode indicar que a filial não está registrando ou está inativa.</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Filial</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Responsável</th>
                </tr>
              </thead>
              <tbody>
                {filiaisSemMovimentacao.map((f, i) => (
                  <tr key={i}>
                    <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{f.nome}</td>
                    <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{f.responsavel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalGaps === 0 && (
          <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '32px' }}>Nenhuma anomalia encontrada no momento.</p>
        )}
      </div>
    </>
  );
}