const express = require('express');
const router = express.Router();
const { getSheets, SPREADSHEET_ID, getNextId } = require('../config/sheets');

router.get('/', async (req, res) => {
  try {
    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Insumos!A:G',
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
    console.error('Erro ao buscar insumos:', error);
    res.status(500).json({ error: 'Erro ao buscar insumos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome, unidade, estoque_minimo, ativo } = req.body;

    if (!nome || !unidade || !estoque_minimo) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, unidade, estoque_minimo' });
    }

    const sheets = await getSheets();
    const id = await getNextId('Insumos');
    const agora = new Date().toISOString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Insumos!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[id, nome, unidade, estoque_minimo, ativo || 'ativo', agora, agora]],
      },
    });

    res.status(201).json({ message: 'Insumo cadastrado com sucesso!', id });
  } catch (error) {
    console.error('Erro ao cadastrar insumo:', error);
    res.status(500).json({ error: 'Erro ao cadastrar insumo' });
  }
});

module.exports = router;