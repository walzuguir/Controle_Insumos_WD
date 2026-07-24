const express = require('express');
const router = express.Router();
const { getSheets, SPREADSHEET_ID } = require('../config/sheets');
const { parseRows, calcularSaldos, filtrarPorPerfil } = require('../services/calculos');

router.get('/', async (req, res) => {
  try {
    const sheets = await getSheets();

    const [movimentacoesRes, insumosRes, filiaisRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Movimentacoes!A:K' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Insumos!A:G' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Filiais!A:G' }),
    ]);

    const saldos = calcularSaldos(
      parseRows(movimentacoesRes),
      parseRows(insumosRes),
      parseRows(filiaisRes)
    );

    res.json(filtrarPorPerfil(saldos, req.usuario.filial_id));
  } catch (error) {
    console.error('Erro ao calcular saldos:', error);
    res.status(500).json({ error: 'Erro ao calcular saldos' });
  }
});

module.exports = router;