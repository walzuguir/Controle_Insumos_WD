const express = require('express');
const router = express.Router();
const { getSheets, SPREADSHEET_ID } = require('../config/sheets');

router.get('/', async (req, res) => {
  try {
    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Movimentacoes!A:H',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.json([]);
    }

    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    res.status(500).json({ error: 'Erro ao buscar movimentações' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { id, data, tipo, insumo_id, filial_origem, filial_destino, quantidade, responsavel_id } = req.body;

    const sheets = await getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Movimentacoes!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[id, data, tipo, insumo_id, filial_origem, filial_destino, quantidade, responsavel_id]],
      },
    });

    res.status(201).json({ message: 'Movimentação registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error);
    res.status(500).json({ error: 'Erro ao registrar movimentação' });
  }
});

module.exports = router;