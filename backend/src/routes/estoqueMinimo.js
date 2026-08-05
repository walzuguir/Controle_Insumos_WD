const express = require('express');
const router = express.Router();
const { getSheets, SPREADSHEET_ID, getNextId, findRowById } = require('../config/sheets');
const { invalidarCache } = require('./saldos');

let cacheEstoqueMinimo = null;
let cacheEstoqueMinimoTimestamp = null;
const CACHE_TTL_ESTOQUE = 60000;

router.get('/', async (req, res) => {
  try {
    if (cacheEstoqueMinimo && cacheEstoqueMinimoTimestamp && (Date.now() - cacheEstoqueMinimoTimestamp < CACHE_TTL_ESTOQUE)) {
      return res.json(cacheEstoqueMinimo);
    }

    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'EstoqueMinimo!A:F',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.json([]);
    }

    const headers = rows[0];
    const data = rows.slice(1)
      .map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      })
      .filter(e => e.filial_id && e.insumo_id && e.estoque_minimo && e.estoque_minimo !== '');

    cacheEstoqueMinimo = data;
    cacheEstoqueMinimoTimestamp = Date.now();

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar estoques mínimos:', error);
    res.status(500).json({ error: 'Erro ao buscar estoques mínimos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { filial_id, insumo_id, estoque_minimo } = req.body;

    if (!filial_id || !insumo_id || estoque_minimo === undefined) {
      return res.status(400).json({ error: 'Campos obrigatórios: filial_id, insumo_id, estoque_minimo' });
    }

    const sheets = await getSheets();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'EstoqueMinimo!A:F',
    });

    const rows = response.data.values || [];
    let existingRow = null;
    let existingIndex = -1;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === filial_id && rows[i][2] === insumo_id) {
        existingRow = rows[i];
        existingIndex = i;
        break;
      }
    }

    const agora = new Date().toISOString();

    if (existingRow) {
      const linha = existingIndex + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `EstoqueMinimo!D${linha}:F${linha}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[estoque_minimo, existingRow[4] || agora, agora]],
        },
      });
      
      invalidarCache();

      cacheEstoqueMinimo = null;
      cacheEstoqueMinimoTimestamp = null;
      return res.json({ 
        message: 'Estoque mínimo atualizado com sucesso!',
        atualizado: true
      });
    } else {
      const id = await getNextId('EstoqueMinimo');
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'EstoqueMinimo!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[id, filial_id, insumo_id, estoque_minimo, agora, agora]],
        },
      });
      
      invalidarCache();
      
      cacheEstoqueMinimo = null;
      cacheEstoqueMinimoTimestamp = null;
      return res.status(201).json({ 
        message: 'Estoque mínimo cadastrado com sucesso!', 
        id 
      });
    }
  } catch (error) {
    console.error('Erro ao salvar estoque mínimo:', error);
    res.status(500).json({ error: 'Erro ao salvar estoque mínimo' });
  }
});

router.delete('/:filial_id/:insumo_id', async (req, res) => {
  try {
    const { filial_id, insumo_id } = req.params;
    const sheets = await getSheets();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'EstoqueMinimo!A:F',
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === filial_id && rows[i][2] === insumo_id) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    const linha = rowIndex + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `EstoqueMinimo!D${linha}:F${linha}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['', '', '']],
      },
    });

    invalidarCache();

    cacheEstoqueMinimo = null;
    cacheEstoqueMinimoTimestamp = null;
    res.json({ message: 'Configuração removida com sucesso!' });
  } catch (error) {
    console.error('Erro ao remover estoque mínimo:', error);
    res.status(500).json({ error: 'Erro ao remover estoque mínimo' });
  }
});

module.exports = router;