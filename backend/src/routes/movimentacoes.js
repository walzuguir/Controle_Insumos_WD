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
    const { tipo, insumo_id, filial_destino, quantidade, nota_fiscal, filial_origem } = req.body;

    const ehGestor = req.usuario.filial_id === 'gestor';
    const responsavel_id = req.usuario.id;

    const tiposValidos = ['entrada', 'saida', 'transferencia'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de movimentação inválido' });
    }

    if (tipo === 'transferencia' && !ehGestor) {
      return res.status(403).json({ error: 'Apenas o gestor pode registrar transferências' });
    }

    if (tipo === 'entrada' && !ehGestor) {
      return res.status(403).json({ error: 'Apenas o gestor pode registrar entrada de insumos' });
    }

    const qtd = Number(quantidade);
    if (!Number.isInteger(qtd) || qtd <= 0) {
      return res.status(400).json({ error: 'Quantidade deve ser um número inteiro maior que zero' });
    }

    const sheets = await getSheets();

    // Buscar filiais para validação
    const filiaisRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Filiais!A:E'
    });

    const existeAtivo = (resposta, id) => {
      const linha = (resposta.data.values || []).slice(1).find(r => r[0] === id);
      return Boolean(linha) && linha[4] !== 'inativo';
    };

    // Validar insumo
    const insumosRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Insumos!A:E'
    });

    if (!existeAtivo(insumosRes, insumo_id)) {
      return res.status(400).json({ error: 'Insumo não encontrado ou inativo' });
    }

    let filial_origem_final = 'fornecedor';
    let destino = '';

    // Lógica para ENTRADA
    if (tipo === 'entrada') {
      filial_origem_final = 'fornecedor';

      if (ehGestor && filial_destino) {
        // Gestor escolheu uma filial destino
        destino = filial_destino;

        // Validar se a filial destino existe e está ativa
        if (!existeAtivo(filiaisRes, destino)) {
          return res.status(400).json({ error: 'Filial de destino não encontrada ou inativa' });
        }
      } else {
        // Fallback (nunca deve acontecer porque validamos no frontend)
        return res.status(400).json({ error: 'Filial destino não informada' });
      }
    }

    // Lógica para SAÍDA
    if (tipo === 'saida') {
      if (ehGestor && filial_origem) {
        filial_origem_final = filial_origem;
        if (!existeAtivo(filiaisRes, filial_origem_final)) {
          return res.status(400).json({ error: 'Filial de origem não encontrada ou inativa' });
        }
      } else {
        filial_origem_final = req.usuario.filial_id;
      }
    }

    // Lógica para TRANSFERÊNCIA
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
    }

    const agora = new Date().toISOString();

    // Se for transferência, cria duas movimentações
    if (tipo === 'transferencia') {
      const idSaida = await getNextId('Movimentacoes');
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Movimentacoes!A:K',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[idSaida, agora, 'saida', insumo_id, filial_origem_final, destino, qtd, responsavel_id, agora, agora, '']],
        },
      });

      const idEntrada = await getNextId('Movimentacoes');
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Movimentacoes!A:K',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[idEntrada, agora, 'entrada', insumo_id, filial_origem_final, destino, qtd, responsavel_id, agora, agora, '']],
        },
      });

      return res.status(201).json({ message: 'Transferência registrada com sucesso!' });
    }

    // Movimentação normal (entrada ou saída)
    const id = await getNextId('Movimentacoes');
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Movimentacoes!A:K',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[id, agora, tipo, insumo_id, filial_origem_final, destino, qtd, responsavel_id, agora, agora, nota_fiscal || '']],
      },
    });

    res.status(201).json({ message: 'Movimentação registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error);
    res.status(500).json({ error: 'Erro ao registrar movimentação' });
  }
});

module.exports = router;