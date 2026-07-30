const express = require('express');
const router = express.Router();
const { getSheets, SPREADSHEET_ID, getNextId, findRowById } = require('../config/sheets');
const { getCache, setCache } = require('../services/cache');

let cacheFiliais = null;
let cacheFiliaisTimestamp = null;
const CACHE_TTL_FILIAIS = 60000;

router.get('/', async (req, res) => {
  try {
    const incluirInativos = req.query.incluir_inativos === 'true';
    
    if (!incluirInativos && cacheFiliais && cacheFiliaisTimestamp && (Date.now() - cacheFiliaisTimestamp < CACHE_TTL_FILIAIS)) {
      return res.json(cacheFiliais);
    }

    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Filiais!A:G',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.json([]);
    }

    const headers = rows[0];
    let data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    if (!incluirInativos) {
      data = data.filter(item => item.ativo !== 'inativo');
    }

    if (!incluirInativos) {
      cacheFiliais = data;
      cacheFiliaisTimestamp = Date.now();
    }

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
    const id = await getNextId('Filiais');
    const agora = new Date().toISOString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Filiais!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[id, nome, endereco, responsavel, ativo || 'ativo', agora, agora]],
      },
    });

    cacheFiliais = null;
    cacheFiliaisTimestamp = null;
    res.status(201).json({ message: 'Filial cadastrada com sucesso!', id });
  } catch (error) {
    console.error('Erro ao cadastrar filial:', error);
    res.status(500).json({ error: 'Erro ao cadastrar filial' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, endereco, responsavel, ativo } = req.body;

    if (!nome || !endereco || !responsavel) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, endereco, responsavel' });
    }

    const linha = await findRowById('Filiais', id);
    if (linha === -1) {
      return res.status(404).json({ error: 'Filial não encontrada' });
    }

    const sheets = await getSheets();

    const atual = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Filiais!F${linha}:G${linha}`,
    });
    const createdAt = atual.data.values?.[0]?.[0] || new Date().toISOString();
    const agora = new Date().toISOString();

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Filiais!A${linha}:G${linha}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[id, nome, endereco, responsavel, ativo || 'ativo', createdAt, agora]],
      },
    });

    cacheFiliais = null;
    cacheFiliaisTimestamp = null;
    res.json({ message: 'Filial atualizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar filial:', error);
    res.status(500).json({ error: 'Erro ao atualizar filial' });
  }
});

router.patch('/:id/desativar', async (req, res) => {
  try {
    const { id } = req.params;
    const linha = await findRowById('Filiais', id);
    if (linha === -1) {
      return res.status(404).json({ error: 'Filial não encontrada' });
    }

    const sheets = await getSheets();
    const agora = new Date().toISOString();

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Filiais!E${linha}:E${linha}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['inativo']] },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Filiais!G${linha}:G${linha}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[agora]] },
    });
    cacheFiliais = null;
    cacheFiliaisTimestamp = null;
    res.json({ message: 'Filial desativada com sucesso!' });
  } catch (error) {
    console.error('Erro ao desativar filial:', error);
    res.status(500).json({ error: 'Erro ao desativar filial' });
  }
});

router.patch('/:id/reativar', async (req, res) => {
  try {
    const { id } = req.params;
    const linha = await findRowById('Filiais', id);
    if (linha === -1) {
      return res.status(404).json({ error: 'Filial não encontrada' });
    }

    const sheets = await getSheets();
    const agora = new Date().toISOString();

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Filiais!E${linha}:E${linha}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['ativo']] },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Filiais!G${linha}:G${linha}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[agora]] },
    });

    cacheFiliais = null;
    cacheFiliaisTimestamp = null;
    res.json({ message: 'Filial reativada com sucesso!' });
  } catch (error) {
    console.error('Erro ao reativar filial:', error);
    res.status(500).json({ error: 'Erro ao reativar filial' });
  }
});

module.exports = router;