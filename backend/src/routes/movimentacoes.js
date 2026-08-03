const express = require('express');
const router = express.Router();
const { getSheets, SPREADSHEET_ID, getNextId } = require('../config/sheets');
const { parseRows, calcularSaldos, filtrarPorPerfil, verificarSaldoDisponivel } = require('../services/calculos');
const { getCache, setCache } = require('../services/cache');
const { invalidarCache } = require('./saldos');

let cacheMovimentacoes = null;
let cacheMovimentacoesTimestamp = null;
const CACHE_TTL_MOV = 30000;

router.get('/', async (req, res) => {
  try {
    const { filial, insumo_id, tipo, data_inicio, data_fim } = req.query;
    const hasFilters = filial || insumo_id || tipo || data_inicio || data_fim;

    if (!hasFilters && cacheMovimentacoes && cacheMovimentacoesTimestamp && (Date.now() - cacheMovimentacoesTimestamp < CACHE_TTL_MOV)) {
      return res.json(cacheMovimentacoes);
    }

    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Movimentacoes!A:L',
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

    const ehGestor = req.usuario.filial_id === 'gestor';
    const filialFiltro = ehGestor ? filial : req.usuario.filial_id;

    if (filialFiltro && !ehGestor) {
      data = data.filter(m => m.filial_origem === filialFiltro || m.filial_destino === filialFiltro);
    } else if (filialFiltro && ehGestor) {
      data = data.filter(m => m.filial_origem === filialFiltro || m.filial_destino === filialFiltro);
    }

    if (insumo_id) {
      data = data.filter(m => m.insumo_id === insumo_id);
    }
    if (tipo) {
      data = data.filter(m => m.tipo === tipo);
    }
    if (data_inicio) {
      const inicio = new Date(data_inicio + 'T00:00:00');
      data = data.filter(m => new Date(m.data) >= inicio);
    }
    if (data_fim) {
      const fim = new Date(data_fim + 'T23:59:59.999');
      data = data.filter(m => new Date(m.data) <= fim);
    }

    if (!hasFilters) {
      cacheMovimentacoes = data;
      cacheMovimentacoesTimestamp = Date.now();
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    res.status(500).json({ error: 'Erro ao buscar movimentações' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { tipo, insumo_id, filial_destino, quantidade, nota_fiscal, filial_origem, requisitante } = req.body;

    const ehGestor = req.usuario.filial_id === 'gestor';
    const responsavel_id = req.usuario.id;

    let filial_origem_final = 'fornecedor';
    let destino = '';

    const tiposValidos = ['entrada', 'saida', 'transferencia'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de movimentação inválido' });
    }

    if (tipo === 'transferencia' && !ehGestor) {
      return res.status(403).json({ error: 'Apenas o gestor pode registrar transferências' });
    }

    if (tipo === 'entrada') {
      filial_origem_final = 'fornecedor';

      if (ehGestor && filial_destino) {
        destino = filial_destino;
        if (!existeAtivo(filiaisRes, destino)) {
          return res.status(400).json({ error: 'Filial de destino não encontrada ou inativa' });
        }
      } else if (!ehGestor) {
        destino = req.usuario.filial_id;
      } else {
        return res.status(400).json({ error: 'Filial destino não informada' });
      }
    }

    const qtd = Number(quantidade);
    if (!Number.isInteger(qtd) || qtd <= 0) {
      return res.status(400).json({ error: 'Quantidade deve ser um número inteiro maior que zero' });
    }

    const sheets = await getSheets();

    const filiaisRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Filiais!A:E'
    });

    const existeAtivo = (resposta, id) => {
      const linha = (resposta.data.values || []).slice(1).find(r => r[0] === id);
      return Boolean(linha) && linha[4] !== 'inativo';
    };

    const insumosRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Insumos!A:E'
    });

    if (!existeAtivo(insumosRes, insumo_id)) {
      return res.status(400).json({ error: 'Insumo não encontrado ou inativo' });
    }

    if (tipo === 'saida') {
      if (ehGestor && filial_origem) {
        filial_origem_final = filial_origem;
        if (!existeAtivo(filiaisRes, filial_origem_final)) {
          return res.status(400).json({ error: 'Filial de origem não encontrada ou inativa' });
        }
      } else {
        filial_origem_final = req.usuario.filial_id;
      }

      try {
        await verificarSaldoDisponivel(sheets, insumo_id, filial_origem_final, qtd);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    }

    if (tipo === 'transferencia') {
      if (!filial_destino) {
        return res.status(400).json({ error: 'Filial destino é obrigatória na transferência' });
      }
      if (!existeAtivo(filiaisRes, filial_destino)) {
        return res.status(400).json({ error: 'Filial destino não encontrada ou inativa' });
      }

      filial_origem_final = ehGestor && filial_origem ? filial_origem : req.usuario.filial_id;
      destino = filial_destino;

      if (destino === filial_origem_final) {
        return res.status(400).json({ error: 'Filial destino deve ser diferente da origem' });
      }

      try {
        await verificarSaldoDisponivel(sheets, insumo_id, filial_origem_final, qtd);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    }

    const agora = new Date().toISOString();

    if (tipo === 'transferencia') {
      const idSaida = await getNextId('Movimentacoes');
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Movimentacoes!A:L',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[idSaida, agora, 'saida', insumo_id, filial_origem_final, destino, qtd, responsavel_id, agora, agora, '', requisitante || '']],
        },
      });

      const idEntrada = await getNextId('Movimentacoes');
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Movimentacoes!A:L',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[idEntrada, agora, 'entrada', insumo_id, filial_origem_final, destino, qtd, responsavel_id, agora, agora, '', requisitante || '']],
        },
      });


      cacheMovimentacoes = null;
      cacheMovimentacoesTimestamp = null;
      invalidarCache();
      return res.status(201).json({ message: 'Transferência registrada com sucesso!' });
    }

    const id = await getNextId('Movimentacoes');
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Movimentacoes!A:L',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[id, agora, tipo, insumo_id, filial_origem_final, destino, qtd, responsavel_id, agora, agora, nota_fiscal || '', requisitante || '']],
      },
    });

    cacheMovimentacoes = null;
    cacheMovimentacoesTimestamp = null;
    invalidarCache();
    res.status(201).json({ message: 'Movimentação registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error);
    res.status(500).json({ error: 'Erro ao registrar movimentação' });
  }
});

module.exports = router;