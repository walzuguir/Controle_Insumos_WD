const { test } = require('node:test');
const assert = require('node:assert');
const { calcularSaldos, filtrarPorPerfil } = require('./calculos');

test('entrada soma e saída subtrai do saldo', () => {
  const movimentacoes = [
    { tipo: 'entrada', filial_destino: '1', insumo_id: '10', quantidade: '100' },
    { tipo: 'saida', filial_origem: '1', insumo_id: '10', quantidade: '30' },
  ];
  const insumos = [{ id: '10', nome: 'Papel A4', unidade: 'Resma', estoque_minimo: '20' }];
  const filiais = [{ id: '1', nome: 'Centro de Distribuição' }];

  const resultado = calcularSaldos(movimentacoes, insumos, filiais);

  assert.strictEqual(resultado.length, 1);
  assert.strictEqual(resultado[0].saldo, 70);
});

test('saldo igual ou abaixo do mínimo marca status crítico', () => {
  const movimentacoes = [
    { tipo: 'entrada', filial_destino: '1', insumo_id: '10', quantidade: '20' },
  ];
  const insumos = [{ id: '10', nome: 'Papel A4', unidade: 'Resma', estoque_minimo: '20' }];
  const filiais = [{ id: '1', nome: 'Centro de Distribuição' }];

  const resultado = calcularSaldos(movimentacoes, insumos, filiais);

  assert.strictEqual(resultado[0].status, 'critico');
});

test('transferência credita destino e debita origem separadamente', () => {
  const movimentacoes = [
    { tipo: 'saida', filial_origem: '1', insumo_id: '10', quantidade: '50' },
    { tipo: 'entrada', filial_destino: '2', insumo_id: '10', quantidade: '50' },
  ];
  const insumos = [{ id: '10', nome: 'Papel A4', unidade: 'Resma', estoque_minimo: '20' }];
  const filiais = [{ id: '1', nome: 'CD' }, { id: '2', nome: 'M1 Garage' }];

  const resultado = calcularSaldos(movimentacoes, insumos, filiais);
  const cd = resultado.find(r => r.filial_id === '1');
  const m1 = resultado.find(r => r.filial_id === '2');

  assert.strictEqual(cd.saldo, -50);
  assert.strictEqual(m1.saldo, 50);
});

test('gestor vê saldos de todas as filiais', () => {
  const saldos = [
    { filial_id: '1', saldo: 10 },
    { filial_id: '2', saldo: 20 },
  ];
  const resultado = filtrarPorPerfil(saldos, 'gestor');
  assert.strictEqual(resultado.length, 2);
});

test('responsável vê apenas saldos da própria filial', () => {
  const saldos = [
    { filial_id: '1', saldo: 10 },
    { filial_id: '2', saldo: 20 },
  ];
  const resultado = filtrarPorPerfil(saldos, '2');
  assert.strictEqual(resultado.length, 1);
  assert.strictEqual(resultado[0].filial_id, '2');
});