const express = require('express');
const router = express.Router();
const { getSheets, SPREADSHEET_ID } = require('../config/sheets');

router.get('/', async (req, res) => {
  try {
    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Filiais!A:E',
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
    console.error('Erro ao buscar filiais:', error);
    res.status(500).json({ error: 'Erro ao buscar filiais' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome, endereco, responsavel, ativo } = req.body;

    if (!nome || !endereco || !responsavel) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, endereco, responsavel' });
    }

    const sheets = await getSheets();
    const id = Date.now().toString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Filiais!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[id, nome, endereco, responsavel, ativo || 'ativo']],
      },
    });

    res.status(201).json({ message: 'Filial cadastrada com sucesso!', id });
  } catch (error) {
    console.error('Erro ao cadastrar filial:', error);
    res.status(500).json({ error: 'Erro ao cadastrar filial' });
  }
});

module.exports = router;