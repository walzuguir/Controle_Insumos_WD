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

module.exports = router;