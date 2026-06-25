const express = require('express');
const router = express.Router();
const { getSheets, SPREADSHEET_ID } = require('../config/sheets');

router.get('/', async (req, res) => {
  try {
    const sheets = await getSheets();

    const [movimentacoesRes, insumosRes, filiaisRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Movimentacoes!A:J' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Insumos!A:G' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Filiais!A:G' }),
    ]);

    const parseRows = (res) => {
      const rows = res.data.values;
      if (!rows || rows.length <= 1) return [];
      const headers = rows[0];
      return rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = row[i] || '');
        return obj;
      });
    };

    const movimentacoes = parseRows(movimentacoesRes);
    const insumos = parseRows(insumosRes);
    const filiais = parseRows(filiaisRes);

    const saldos = {};

    movimentacoes.forEach(mov => {
      const filial = mov.tipo === 'entrada' ? mov.filial_destino : mov.filial_origem;
      const chave = `${filial}__${mov.insumo_id}`;

      if (!saldos[chave]) {
        saldos[chave] = { filial_id: filial, insumo_id: mov.insumo_id, saldo: 0 };
      }

      const qtd = parseFloat(mov.quantidade) || 0;
      if (mov.tipo === 'entrada') {
        saldos[chave].saldo += qtd;
      } else if (mov.tipo === 'saida') {
        saldos[chave].saldo -= qtd;
      }
    });

    const resultado = Object.values(saldos).map(s => {
      const insumo = insumos.find(i => i.id === s.insumo_id);
      const filial = filiais.find(f => f.id === s.filial_id);
      return {
        filial_id: s.filial_id,
        filial_nome: filial ? filial.nome : s.filial_id,
        insumo_id: s.insumo_id,
        insumo_nome: insumo ? insumo.nome : s.insumo_id,
        insumo_unidade: insumo ? insumo.unidade : '',
        estoque_minimo: insumo ? parseFloat(insumo.estoque_minimo) : 0,
        saldo: s.saldo,
        status: s.saldo <= (insumo ? parseFloat(insumo.estoque_minimo) : 0) ? 'critico' : 'ok',
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao calcular saldos:', error);
    res.status(500).json({ error: 'Erro ao calcular saldos' });
  }
});

module.exports = router;