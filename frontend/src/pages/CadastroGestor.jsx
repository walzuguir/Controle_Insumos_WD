import { useState, useEffect } from 'react';
import Header from '../components/Header';
import api from '../services/api';

export default function CadastroGestor() {
  const [insumos, setInsumos] = useState([]);
  const [filiais, setFiliais] = useState([]);
  const [aba, setAba] = useState('insumos');

  const [formInsumo, setFormInsumo] = useState({ nome: '', unidade: '', estoque_minimo: '', ativo: 'ativo' });
  const [formFilial, setFormFilial] = useState({ nome: '', endereco: '', responsavel: '', ativo: 'ativo' });
  const [editandoInsumo, setEditandoInsumo] = useState(null);
  const [editandoFilial, setEditandoFilial] = useState(null);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    api.get('/insumos?incluir_inativos=true').then((res) => setInsumos(res.data));
    api.get('/filiais?incluir_inativos=true').then((res) => setFiliais(res.data));
  }, []);

  const handleSubmitInsumo = async (e) => {
    e.preventDefault();
    try {
      if (editandoInsumo) {
        await api.put(`/insumos/${editandoInsumo}`, formInsumo);
        setMensagem('Insumo atualizado com sucesso!');
      } else {
        await api.post('/insumos', formInsumo);
        setMensagem('Insumo cadastrado com sucesso!');
      }
      setFormInsumo({ nome: '', unidade: '', estoque_minimo: '', ativo: 'ativo' });
      setEditandoInsumo(null);
      const res = await api.get('/insumos?incluir_inativos=true');
      setInsumos(res.data);
    } catch {
      setMensagem('Erro ao salvar insumo.');
    }
  };

  const handleSubmitFilial = async (e) => {
    e.preventDefault();
    try {
      if (editandoFilial) {
        await api.put(`/filiais/${editandoFilial}`, formFilial);
        setMensagem('Filial atualizada com sucesso!');
      } else {
        await api.post('/filiais', formFilial);
        setMensagem('Filial cadastrada com sucesso!');
      }
      setFormFilial({ nome: '', endereco: '', responsavel: '', ativo: 'ativo' });
      setEditandoFilial(null);
      const res = await api.get('/filiais?incluir_inativos=true');
      setFiliais(res.data);
    } catch {
      setMensagem('Erro ao salvar filial.');
    }
  };

  const editarInsumo = (i) => {
    setFormInsumo({ nome: i.nome, unidade: i.unidade, estoque_minimo: i.estoque_minimo, ativo: i.ativo });
    setEditandoInsumo(i.id);
    setMensagem('');
  };

  const desativarInsumo = async (id) => {
    if (!confirm('Tem certeza que deseja desativar este insumo?')) return;
    try {
      await api.patch(`/insumos/${id}/desativar`);
      setMensagem('Insumo desativado com sucesso!');
      const res = await api.get('/insumos?incluir_inativos=true');
      setInsumos(res.data);
    } catch {
      setMensagem('Erro ao desativar insumo.');
    }
  };

  const editarFilial = (f) => {
    setFormFilial({ nome: f.nome, endereco: f.endereco, responsavel: f.responsavel, ativo: f.ativo });
    setEditandoFilial(f.id);
    setMensagem('');
  };

  const desativarFilial = async (id) => {
    if (!confirm('Tem certeza que deseja desativar esta filial?')) return;
    try {
      await api.patch(`/filiais/${id}/desativar`);
      setMensagem('Filial desativada com sucesso!');
      const res = await api.get('/filiais?incluir_inativos=true');
      setFiliais(res.data);
    } catch {
      setMensagem('Erro ao desativar filial.');
    }
  };

  const reativarInsumo = async (id) => {
    try {
      await api.patch(`/insumos/${id}/reativar`);
      setMensagem('Insumo reativado com sucesso!');
      const res = await api.get('/insumos?incluir_inativos=true');
      setInsumos(res.data);
    } catch {
      setMensagem('Erro ao reativar insumo.');
    }
  };

  const reativarFilial = async (id) => {
    try {
      await api.patch(`/filiais/${id}/reativar`);
      setMensagem('Filial reativada com sucesso!');
      const res = await api.get('/filiais?incluir_inativos=true');
      setFiliais(res.data);
    } catch {
      setMensagem('Erro ao reativar filial.');
    }
  };

  const cancelarEdicaoInsumo = () => {
    setFormInsumo({ nome: '', unidade: '', estoque_minimo: '', ativo: 'ativo' });
    setEditandoInsumo(null);
  };

  const cancelarEdicaoFilial = () => {
    setFormFilial({ nome: '', endereco: '', responsavel: '', ativo: 'ativo' });
    setEditandoFilial(null);
  };


  const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '500', color: '#436eb3', marginBottom: '4px' };
  const inputStyle = { display: 'block', width: '100%', padding: '8px', marginBottom: '16px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' };
  const btnEditar = { padding: '4px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' };
  const btnDesativar = { padding: '4px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginLeft: '6px' };
  const btnReativar = { padding: '4px 12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginLeft: '6px' };

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
            <h3 style={{ marginBottom: '16px' }}>{editandoInsumo ? 'Editar Insumo' : 'Cadastrar Insumo'}</h3>
            <form onSubmit={handleSubmitInsumo} style={{ marginBottom: '32px' }}>
              <label htmlFor="nome_insumo" style={labelStyle}>Nome do insumo</label>
              <input id="nome_insumo" placeholder="Ex: Papel A4" value={formInsumo.nome} onChange={(e) => setFormInsumo({ ...formInsumo, nome: e.target.value })} required style={inputStyle} />

              <label htmlFor="unidade" style={labelStyle}>Unidade</label>
              <input id="unidade" placeholder="Ex: Resma, Caixa, Litro" value={formInsumo.unidade} onChange={(e) => setFormInsumo({ ...formInsumo, unidade: e.target.value })} required style={inputStyle} />

              <label htmlFor="estoque_minimo" style={labelStyle}>Estoque mínimo</label>
              <input id="estoque_minimo" placeholder="Ex: 10" type="number" value={formInsumo.estoque_minimo} onChange={(e) => setFormInsumo({ ...formInsumo, estoque_minimo: e.target.value })} required style={inputStyle} />

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  {editandoInsumo ? 'Salvar alterações' : 'Cadastrar'}
                </button>
                {editandoInsumo && (
                  <button type="button" onClick={cancelarEdicaoInsumo} style={{ padding: '10px 20px', background: '#e5e7eb', color: 'black', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            <h3 style={{ marginBottom: '12px' }}>Insumos cadastrados</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Nome</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Unidade</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Estoque mínimo</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {insumos.map((i) => (
                  <tr key={i.id} style={{ opacity: i.ativo === 'inativo' ? 0.5 : 1 }}>
                    <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>
                      {i.nome}
                      {i.ativo === 'inativo' && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#dc2626' }}>(inativo)</span>}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{i.unidade}</td>
                    <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{i.estoque_minimo}</td>
                    <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>
                      <button onClick={() => editarInsumo(i)} style={btnEditar}>Editar</button>
                      {i.ativo === 'inativo' ? (
                        <button onClick={() => reativarInsumo(i.id)} style={btnReativar}>Reativar</button>
                      ) : (
                        <button onClick={() => desativarInsumo(i.id)} style={btnDesativar}>Desativar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {aba === 'filiais' && (
          <div>
            <h3 style={{ marginBottom: '16px' }}>{editandoFilial ? 'Editar Filial' : 'Cadastrar Filial'}</h3>
            <form onSubmit={handleSubmitFilial} style={{ marginBottom: '32px' }}>
              <label htmlFor="nome_filial" style={labelStyle}>Nome da filial</label>
              <input id="nome_filial" placeholder="Ex: Filial Centro" value={formFilial.nome} onChange={(e) => setFormFilial({ ...formFilial, nome: e.target.value })} required style={inputStyle} />

              <label htmlFor="endereco" style={labelStyle}>Endereço</label>
              <input id="endereco" placeholder="Ex: Rua da Assembleia, 10 - Centro, RJ" value={formFilial.endereco} onChange={(e) => setFormFilial({ ...formFilial, endereco: e.target.value })} required style={inputStyle} />

              <label htmlFor="responsavel" style={labelStyle}>Responsável</label>
              <input id="responsavel" placeholder="Ex: João Silva" value={formFilial.responsavel} onChange={(e) => setFormFilial({ ...formFilial, responsavel: e.target.value })} required style={inputStyle} />

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  {editandoFilial ? 'Salvar alterações' : 'Cadastrar'}
                </button>
                {editandoFilial && (
                  <button type="button" onClick={cancelarEdicaoFilial} style={{ padding: '10px 20px', background: '#e5e7eb', color: 'black', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            <h3 style={{ marginBottom: '12px' }}>Filiais cadastradas</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Nome</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Endereço</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Responsável</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filiais.map((f) => (
                  <tr key={f.id} style={{ opacity: f.ativo === 'inativo' ? 0.5 : 1 }}>
                    <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>
                      {f.nome}
                      {f.ativo === 'inativo' && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#dc2626' }}>(inativo)</span>}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{f.endereco}</td>
                    <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{f.responsavel}</td>
                    <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>
                      <button onClick={() => editarFilial(f)} style={btnEditar}>Editar</button>
                      {f.ativo === 'inativo' ? (
                        <button onClick={() => reativarFilial(f.id)} style={btnReativar}>Reativar</button>
                      ) : (
                        <button onClick={() => desativarFilial(f.id)} style={btnDesativar}>Desativar</button>
                      )}
                    </td>
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