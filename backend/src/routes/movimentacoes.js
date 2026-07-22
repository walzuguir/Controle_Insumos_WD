const express = require('express');
const router = express.Router();
const { getSheets, SPREADSHEET_ID, getNextId } = require('../config/sheets');

router.get('/', async (req, res) => {
  try {
    const { filial, insumo_id, tipo, data_inicio, data_fim } = req.query;

    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Movimentacoes!A:K',
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

    if (filialFiltro) {
      data = data.filter(m => m.filial_origem === filialFiltro || m.filial_destino === filialFiltro);
    }
    if (insumo_id) {
      data = data.filter(m => m.insumo_id === insumo_id);
    }
    if (tipo) {
      data = data.filter(m => m.tipo === tipo);
    }
    if (data_inicio) {
      data = data.filter(m => new Date(m.data) >= new Date(data_inicio));
    }
    if (data_fim) {
      data = data.filter(m => new Date(m.data) <= new Date(data_fim));
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    res.status(500).json({ error: 'Erro ao buscar movimentações' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { tipo, insumo_id, filial_destino, quantidade, nota_fiscal } = req.body;

    const ehGestor = req.usuario.filial_id === 'gestor';
    const responsavel_id = req.usuario.id;

    if (tipo === 'transferencia' && !ehGestor) {
      return res.status(403).json({ error: 'Apenas o gestor pode registrar transferências' });
    }

    const filial_origem = tipo === 'entrada'
      ? 'fornecedor'
      : (ehGestor ? '1' : req.usuario.filial_id);

    const sheets = await getSheets();
    const agora = new Date().toISOString();

    if (tipo === 'transferencia') {
      const idSaida = await getNextId('Movimentacoes');
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Movimentacoes!A:K',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[idSaida, agora, 'saida', insumo_id, filial_origem, filial_destino, quantidade, responsavel_id, agora, agora, '']],
        },
      });

      const idEntrada = await getNextId('Movimentacoes');
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Movimentacoes!A:K',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[idEntrada, agora, 'entrada', insumo_id, filial_origem, filial_destino, quantidade, responsavel_id, agora, agora, '']],
        },
      });

      return res.status(201).json({ message: 'Transferência registrada com sucesso!' });
    }

    const id = await getNextId('Movimentacoes');
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Movimentacoes!A:K',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[id, agora, tipo, insumo_id, filial_origem, filial_destino, quantidade, responsavel_id, agora, agora, nota_fiscal || '']],
      },
    });

    res.status(201).json({ message: 'Movimentação registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error);
    res.status(500).json({ error: 'Erro ao registrar movimentação' });
  }
});

module.exports = router;