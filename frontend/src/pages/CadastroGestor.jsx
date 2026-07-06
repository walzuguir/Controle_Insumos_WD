import { useState, useEffect } from 'react';
import Header from '../components/Header';
import api from '../services/api';

export default function CadastroGestor() {
  const [insumos, setInsumos] = useState([]);
  const [filiais, setFiliais] = useState([]);
  const [aba, setAba] = useState('insumos');

  const [formInsumo, setFormInsumo] = useState({ nome: '', unidade: '', estoque_minimo: '', ativo: 'ativo' });
  const [formFilial, setFormFilial] = useState({ nome: '', endereco: '', responsavel: '', ativo: 'ativo' });
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    api.get('/insumos').then((res) => setInsumos(res.data));
    api.get('/filiais').then((res) => setFiliais(res.data));
  }, []);

  const handleSubmitInsumo = async (e) => {
    e.preventDefault();
    try {
      await api.post('/insumos', formInsumo);
      setMensagem('Insumo cadastrado com sucesso!');
      setFormInsumo({ nome: '', unidade: '', estoque_minimo: '', ativo: 'ativo' });
      const res = await api.get('/insumos');
      setInsumos(res.data);
    } catch {
      setMensagem('Erro ao cadastrar insumo.');
    }
  };

  const handleSubmitFilial = async (e) => {
    e.preventDefault();
    try {
      await api.post('/filiais', formFilial);
      setMensagem('Filial cadastrada com sucesso!');
      setFormFilial({ nome: '', endereco: '', responsavel: '', ativo: 'ativo' });
      const res = await api.get('/filiais');
      setFiliais(res.data);
    } catch {
      setMensagem('Erro ao cadastrar filial.');
    }
  };

  const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' };
  const inputStyle = { display: 'block', width: '100%', padding: '8px', marginBottom: '16px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' };

  return (
    <>
      <Header />
      <div style={{ maxWidth: '700px', margin: '40px auto', padding: '32px' }}>
        <h2>Painel do Gestor</h2>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => setAba('insumos')} style={{ padding: '8px 16px', background: aba === 'insumos' ? '#2563eb' : '#e5e7eb', color: aba === 'insumos' ? 'white' : 'black', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Insumos
          </button>
          <button onClick={() => setAba('filiais')} style={{ padding: '8px 16px', background: aba === 'filiais' ? '#2563eb' : '#e5e7eb', color: aba === 'filiais' ? 'white' : 'black', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Filiais
          </button>
        </div>

        {mensagem && <p style={{ color: 'green', marginBottom: '16px' }}>{mensagem}</p>}

        {aba === 'insumos' && (
          <div>
            <h3 style={{ marginBottom: '16px' }}>Cadastrar Insumo</h3>
            <form onSubmit={handleSubmitInsumo} style={{ marginBottom: '32px' }}>
              <label htmlFor="nome_insumo" style={labelStyle}>Nome do insumo</label>
              <input id="nome_insumo" placeholder="Ex: Papel A4" value={formInsumo.nome} onChange={(e) => setFormInsumo({ ...formInsumo, nome: e.target.value })} required style={inputStyle} />

              <label htmlFor="unidade" style={labelStyle}>Unidade</label>
              <input id="unidade" placeholder="Ex: Resma, Caixa, Litro" value={formInsumo.unidade} onChange={(e) => setFormInsumo({ ...formInsumo, unidade: e.target.value })} required style={inputStyle} />

              <label htmlFor="estoque_minimo" style={labelStyle}>Estoque mínimo</label>
              <input id="estoque_minimo" placeholder="Ex: 10" type="number" value={formInsumo.estoque_minimo} onChange={(e) => setFormInsumo({ ...formInsumo, estoque_minimo: e.target.value })} required style={inputStyle} />

              <button type="submit" style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cadastrar</button>
            </form>

            <h3 style={{ marginBottom: '12px' }}>Insumos cadastrados</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Nome</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Unidade</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Estoque mínimo</th>
                </tr>
              </thead>
              <tbody>
                {insumos.map((i) => (
                  <tr key={i.id}>
                    <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{i.nome}</td>
                    <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{i.unidade}</td>
                    <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{i.estoque_minimo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {aba === 'filiais' && (
          <div>
            <h3 style={{ marginBottom: '16px' }}>Cadastrar Filial</h3>
            <form onSubmit={handleSubmitFilial} style={{ marginBottom: '32px' }}>
              <label htmlFor="nome_filial" style={labelStyle}>Nome da filial</label>
              <input id="nome_filial" placeholder="Ex: Filial Centro" value={formFilial.nome} onChange={(e) => setFormFilial({ ...formFilial, nome: e.target.value })} required style={inputStyle} />

              <label htmlFor="endereco" style={labelStyle}>Endereço</label>
              <input id="endereco" placeholder="Ex: Rua da Assembleia, 10 - Centro, RJ" value={formFilial.endereco} onChange={(e) => setFormFilial({ ...formFilial, endereco: e.target.value })} required style={inputStyle} />

              <label htmlFor="responsavel" style={labelStyle}>Responsável</label>
              <input id="responsavel" placeholder="Ex: João Silva" value={formFilial.responsavel} onChange={(e) => setFormFilial({ ...formFilial, responsavel: e.target.value })} required style={inputStyle} />

              <button type="submit" style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cadastrar</button>
            </form>

            <h3 style={{ marginBottom: '12px' }}>Filiais cadastradas</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Nome</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Endereço</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Responsável</th>
                </tr>
              </thead>
              <tbody>
                {filiais.map((f) => (
                  <tr key={f.id}>
                    <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{f.nome}</td>
                    <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{f.endereco}</td>
                    <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{f.responsavel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}