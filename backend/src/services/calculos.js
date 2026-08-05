const { SPREADSHEET_ID } = require('../config/sheets');

function parseRows(resposta) {
  const rows = resposta.data.values;
  if (!rows || rows.length <= 1) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] || '');
    return obj;
  });
}

function calcularSaldos(movimentacoes, insumos, filiais) {
  const saldos = {};

  movimentacoes.forEach(mov => {
    const filial = mov.tipo === 'entrada' ? mov.filial_destino : mov.filial_origem;
    const chave = `${filial}__${mov.insumo_id}`;

    if (!saldos[chave]) {
      saldos[chave] = { filial_id: filial, insumo_id: mov.insumo_id, saldo: 0 };
    }

    const qtd = parseFloat(mov.quantidade) || 0;
    if (mov.tipo === 'entrada') {
      saldos[chave].saldo += qtd;
    } else if (mov.tipo === 'saida') {
      saldos[chave].saldo -= qtd;
    }
  });

  return Object.values(saldos).map(s => {
    const insumo = insumos.find(i => i.id === s.insumo_id);
    const filial = filiais.find(f => f.id === s.filial_id);
    const minimo = insumo ? parseFloat(insumo.estoque_minimo) : 0;

    return {
      filial_id: s.filial_id,
      filial_nome: filial ? filial.nome : s.filial_id,
      insumo_id: s.insumo_id,
      insumo_nome: insumo ? insumo.nome : s.insumo_id,
      insumo_unidade: insumo ? insumo.unidade : '',
      estoque_minimo: minimo,
      saldo: s.saldo,
      status: s.saldo <= minimo ? 'critico' : 'ok',
    };
  });
}

async function getEstoquesMinimos(sheets) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'EstoqueMinimo!A:F',
    });
    const rows = response.data.values || [];
    if (rows.length <= 1) return [];
    
    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i] || '');
      return obj;
    }).filter(e => e.filial_id && e.insumo_id && e.estoque_minimo && e.estoque_minimo !== '');
  } catch (error) {
    console.warn('⚠️ Aba "EstoqueMinimo" não encontrada. Usando estoque mínimo global.');
    return [];
  }
}

async function calcularSaldosComMinimo(movimentacoes, insumos, filiais, estoquesMinimos) {
  const saldos = {};

  movimentacoes.forEach(mov => {
    const filial = mov.tipo === 'entrada' ? mov.filial_destino : mov.filial_origem;
    const chave = `${filial}__${mov.insumo_id}`;

    if (!saldos[chave]) {
      saldos[chave] = { filial_id: filial, insumo_id: mov.insumo_id, saldo: 0 };
    }

    const qtd = parseFloat(mov.quantidade) || 0;
    if (mov.tipo === 'entrada') {
      saldos[chave].saldo += qtd;
    } else if (mov.tipo === 'saida') {
      saldos[chave].saldo -= qtd;
    }
  });

  return Object.values(saldos).map(s => {
    const insumo = insumos.find(i => i.id === s.insumo_id);
    const filial = filiais.find(f => f.id === s.filial_id);
    
    const minimoEspecifico = estoquesMinimos.find(e => 
      e.filial_id === s.filial_id && e.insumo_id === s.insumo_id
    );
    
    const minimo = minimoEspecifico 
      ? parseFloat(minimoEspecifico.estoque_minimo) 
      : (insumo ? parseFloat(insumo.estoque_minimo) : 0);

    return {
      filial_id: s.filial_id,
      filial_nome: filial ? filial.nome : s.filial_id,
      insumo_id: s.insumo_id,
      insumo_nome: insumo ? insumo.nome : s.insumo_id,
      insumo_unidade: insumo ? insumo.unidade : '',
      estoque_minimo: minimo,
      saldo: s.saldo,
      status: s.saldo <= minimo ? 'critico' : 'ok',
    };
  });
}

function filtrarPorPerfil(saldos, filialUsuario) {
  if (filialUsuario === 'gestor') return saldos;
  return saldos.filter(s => s.filial_id === filialUsuario);
}

async function verificarSaldoDisponivel(sheets, insumo_id, filial_id, quantidade) {
  const movimentacoesRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Movimentacoes!A:L'
  });
  
  const insumosRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Insumos!A:G'
  });
  
  const filiaisRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Filiais!A:G'
  });

  const estoquesMinimos = await getEstoquesMinimos(sheets);

  const saldos = await calcularSaldosComMinimo(
    parseRows(movimentacoesRes),
    parseRows(insumosRes),
    parseRows(filiaisRes),
    estoquesMinimos
  );

  const saldoAtual = saldos.find(s => 
    s.insumo_id === insumo_id && s.filial_id === filial_id
  );

  const saldoDisponivel = saldoAtual ? saldoAtual.saldo : 0;

  if (saldoDisponivel < quantidade) {
    throw new Error(`Saldo insuficiente. Disponível: ${saldoDisponivel}, Solicitado: ${quantidade}`);
  }

  return saldoDisponivel;
}

module.exports = { 
  parseRows, 
  getEstoquesMinimos,
  calcularSaldos,
  calcularSaldosComMinimo,
  filtrarPorPerfil, 
  verificarSaldoDisponivel 
};