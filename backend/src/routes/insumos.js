const express = require('express');
const router = express.Router();
const { getSheets, SPREADSHEET_ID, getNextId, findRowById } = require('../config/sheets');

let cacheInsumos = null;
let cacheInsumosTimestamp = null;
const CACHE_TTL_INSUMOS = 60000;

router.get('/', async (req, res) => {
  try {

    const incluirInativos = req.query.incluir_inativos === 'true';

    if (!incluirInativos && cacheInsumos && cacheInsumosTimestamp && (Date.now() - cacheInsumosTimestamp < CACHE_TTL_INSUMOS)) {
      return res.json(cacheInsumos);
    }

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
      cacheInsumos = data;
      cacheInsumosTimestamp = Date.now();
    }

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

    const minimo = Number(estoque_minimo);
    if (!Number.isFinite(minimo) || minimo < 0) {
      return res.status(400).json({ error: 'Estoque mínimo deve ser um número maior ou igual a zero' });
    }

    const sheets = await getSheets();

    const existentesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Insumos!A:E',
    });
    const linhas = (existentesRes.data.values || []).slice(1);
    const nomeNormalizado = nome.trim().toLowerCase();
    const jaExiste = linhas.some(row =>
      row[1] && row[1].trim().toLowerCase() === nomeNormalizado && row[4] !== 'inativo'
    );

    if (jaExiste) {
      return res.status(409).json({ error: `Já existe um insumo ativo chamado "${nome}"` });
    }

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

    cacheInsumos = null;
    cacheInsumosTimestamp = null;
    res.status(201).json({ message: 'Insumo cadastrado com sucesso!', id });
  } catch (error) {
    console.error('Erro ao cadastrar insumo:', error);
    res.status(500).json({ error: 'Erro ao cadastrar insumo' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, unidade, estoque_minimo, ativo } = req.body;

    if (!nome || !unidade || !estoque_minimo) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, unidade, estoque_minimo' });
    }

    const minimo = Number(estoque_minimo);
    if (!Number.isFinite(minimo) || minimo < 0) {
      return res.status(400).json({ error: 'Estoque mínimo deve ser um número maior ou igual a zero' });
    }

    const linha = await findRowById('Insumos', id);
    if (linha === -1) {
      return res.status(404).json({ error: 'Insumo não encontrado' });
    }

    const sheets = await getSheets();

    const existentesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Insumos!A:E',
    });
    const linhas = (existentesRes.data.values || []).slice(1);
    const nomeNormalizado = nome.trim().toLowerCase();
    const jaExiste = linhas.some(row =>
      row[0] !== id && row[1] && row[1].trim().toLowerCase() === nomeNormalizado && row[4] !== 'inativo'
    );

    if (jaExiste) {
      return res.status(409).json({ error: `Já existe um insumo ativo chamado "${nome}"` });
    }

    const atual = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Insumos!F${linha}:G${linha}`,
    });
    const createdAt = atual.data.values?.[0]?.[0] || new Date().toISOString();
    const agora = new Date().toISOString();

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Insumos!A${linha}:G${linha}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[id, nome, unidade, estoque_minimo, ativo || 'ativo', createdAt, agora]],
      },
    });

    cacheInsumos = null;
    cacheInsumosTimestamp = null;
    res.json({ message: 'Insumo atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar insumo:', error);
    res.status(500).json({ error: 'Erro ao atualizar insumo' });
  }
});

router.patch('/:id/desativar', async (req, res) => {
  try {
    const { id } = req.params;
    const linha = await findRowById('Insumos', id);
    if (linha === -1) {
      return res.status(404).json({ error: 'Insumo não encontrado' });
    }

    const sheets = await getSheets();
    const agora = new Date().toISOString();

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Insumos!E${linha}:E${linha}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['inativo']] },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Insumos!G${linha}:G${linha}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[agora]] },
    });

    cacheInsumos = null;
    cacheInsumosTimestamp = null;
    res.json({ message: 'Insumo desativado com sucesso!' });
  } catch (error) {
    console.error('Erro ao desativar insumo:', error);
    res.status(500).json({ error: 'Erro ao desativar insumo' });
  }
});

router.patch('/:id/reativar', async (req, res) => {
  try {
    const { id } = req.params;
    const linha = await findRowById('Insumos', id);
    if (linha === -1) {
      return res.status(404).json({ error: 'Insumo não encontrado' });
    }

    const sheets = await getSheets();
    const agora = new Date().toISOString();

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Insumos!E${linha}:E${linha}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['ativo']] },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Insumos!G${linha}:G${linha}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[agora]] },
    });

    cacheInsumos = null;
    cacheInsumosTimestamp = null;
    res.json({ message: 'Insumo reativado com sucesso!' });
  } catch (error) {
    console.error('Erro ao reativar insumo:', error);
    res.status(500).json({ error: 'Erro ao reativar insumo' });
  }
});

module.exports = router;