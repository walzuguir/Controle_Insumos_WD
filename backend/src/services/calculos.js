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

function filtrarPorPerfil(saldos, filialUsuario) {
  if (filialUsuario === 'gestor') return saldos;
  return saldos.filter(s => s.filial_id === filialUsuario);
}

module.exports = { parseRows, calcularSaldos, filtrarPorPerfil };