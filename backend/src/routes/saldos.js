const express = require('express');
const router = express.Router();
const { getSheets, SPREADSHEET_ID } = require('../config/sheets');
const { parseRows, calcularSaldosComMinimo, getEstoquesMinimos, filtrarPorPerfil } = require('../services/calculos');

// Cache em memória
let cacheSaldos = null;
let cacheTimestamp = null;
let cacheVersion = 0; // Versão do cache para controle
const CACHE_TTL = 30000; // 30 segundos

// Função para invalidar cache externamente
function invalidarCache() {
  cacheVersion++;
  console.log(`🗑️ Cache de saldos invalidado (versão ${cacheVersion})`);
  return cacheVersion;
}

module.exports.invalidarCache = invalidarCache;

router.get('/', async (req, res) => {
  try {
    if (cacheSaldos && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_TTL)) {
      return res.json(filtrarPorPerfil(cacheSaldos, req.usuario.filial_id));
    }

    const sheets = await getSheets();

    const [movimentacoesRes, insumosRes, filiaisRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Movimentacoes!A:K' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Insumos!A:G' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Filiais!A:G' }),
    ]);

    const estoquesMinimos = await getEstoquesMinimos(sheets);

    const saldos = await calcularSaldosComMinimo(
      parseRows(movimentacoesRes),
      parseRows(insumosRes),
      parseRows(filiaisRes),
      estoquesMinimos
    );

    cacheSaldos = saldos;
    cacheTimestamp = Date.now();

    res.json(filtrarPorPerfil(saldos, req.usuario.filial_id));
  } catch (error) {
    console.error('Erro ao calcular saldos:', error);
    res.status(500).json({ error: 'Erro ao calcular saldos' });
  }
});

module.exports = router;