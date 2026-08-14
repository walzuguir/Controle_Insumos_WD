import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../services/api';
import { Package, Building2, Settings2, AlertCircle, Settings } from 'lucide-react';
import SeletorInsumo from '../components/SeletorInsumo';

export default function CadastroGestor() {
  const [insumos, setInsumos] = useState([]);
  const [filiais, setFiliais] = useState([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const abaDaURL = searchParams.get('aba') || 'insumos';
  const [aba, setAba] = useState(abaDaURL);

  const [formInsumo, setFormInsumo] = useState({ nome: '', unidade: '', estoque_minimo: '', ativo: 'ativo' });
  const [formFilial, setFormFilial] = useState({ nome: '', endereco: '', responsavel: '', ativo: 'ativo' });
  const [estoquesMinimos, setEstoquesMinimos] = useState([]);
  const [formEstoqueMinimo, setFormEstoqueMinimo] = useState({
    filial_id: '',
    insumo_id: '',
    estoque_minimo: ''
  });
  const [editandoInsumo, setEditandoInsumo] = useState(null);
  const [editandoFilial, setEditandoFilial] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [ehErro, setEhErro] = useState(false);

  const handleAbaChange = (novaAba) => {
    setAba(novaAba);
    navigate(`/gestor?aba=${novaAba}`);
  };

  useEffect(() => {
    api.get('/insumos?incluir_inativos=true').then((res) => setInsumos(res.data));
    api.get('/filiais?incluir_inativos=true').then((res) => setFiliais(res.data));
    api.get('/estoque-minimo').then((res) => setEstoquesMinimos(res.data));
  }, []);

  useEffect(() => {
    if (mensagem) {
      const timer = setTimeout(() => {
        setMensagem('');
        setEhErro(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [mensagem]);

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
    } catch (error) {
      setMensagem(error.response?.data?.error || 'Erro ao salvar insumo.');
      setEhErro(true);
    }
  };

  const handleSubmitFilial = async (e) => {
    e.preventDefault();
    try {
      if (editandoFilial) {
        await api.put(`/filiais/${editandoFilial}`, formFilial);
        setMensagem('Filial atualizada com sucesso!');
        setEhErro(false);
      } else {
        await api.post('/filiais', formFilial);
        setMensagem('Filial cadastrada com sucesso!');
        setEhErro(false);
      }
      setFormFilial({ nome: '', endereco: '', responsavel: '', ativo: 'ativo' });
      setEditandoFilial(null);
      const res = await api.get('/filiais?incluir_inativos=true');
      setFiliais(res.data);
    } catch (error) {
      setMensagem(error.response?.data?.error || 'Erro ao salvar filial.');
      setEhErro(true);
    }
  };

  const handleSubmitEstoqueMinimo = async (e) => {
    e.preventDefault();
    try {
      await api.post('/estoque-minimo', formEstoqueMinimo);
      setMensagem('Estoque mínimo configurado com sucesso!');
      setEhErro(false);
      const res = await api.get('/estoque-minimo');
      setEstoquesMinimos(res.data);
      setFormEstoqueMinimo({ filial_id: '', insumo_id: '', estoque_minimo: '' });
    } catch (error) {
      setMensagem(error.response?.data?.error || 'Erro ao configurar estoque mínimo.');
      setEhErro(true);
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
      setEhErro(false);
      const res = await api.get('/insumos?incluir_inativos=true');
      setInsumos(res.data);
    } catch (error) {
      setMensagem('Erro ao desativar insumo.');
      setEhErro(true);
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
      setEhErro(false);
      const res = await api.get('/filiais?incluir_inativos=true');
      setFiliais(res.data);
    } catch (error) {
      setMensagem('Erro ao desativar filial.');
      setEhErro(true);
    }
  };

  const reativarInsumo = async (id) => {
    try {
      await api.patch(`/insumos/${id}/reativar`);
      setMensagem('Insumo reativado com sucesso!');
      setEhErro(false);
      const res = await api.get('/insumos?incluir_inativos=true');
      setInsumos(res.data);
    } catch (error) {
      setMensagem('Erro ao reativar insumo.');
      setEhErro(true);
    }
  };

  const reativarFilial = async (id) => {
    try {
      await api.patch(`/filiais/${id}/reativar`);
      setMensagem('Filial reativada com sucesso!');
      setEhErro(false);
      const res = await api.get('/filiais?incluir_inativos=true');
      setFiliais(res.data);
    } catch (error) {
      setMensagem('Erro ao reativar filial.');
      setEhErro(true);
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


  const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--cor-texto-suave)', marginBottom: '6px' };
  const inputStyle = { display: 'block', width: '100%', padding: '10px', marginBottom: '16px', background: 'var(--cor-superficie-2)', border: '1px solid var(--cor-borda)', borderRadius: '6px', fontSize: '14px', color: 'var(--cor-texto)' };
  const thStyle = { padding: '10px', textAlign: 'left', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto-suave)', fontSize: '13px', fontWeight: '500' };
  const tdStyle = { padding: '10px', border: '1px solid var(--cor-borda)' };
  const btnAcao = { padding: '5px 12px', background: 'transparent', border: '1px solid var(--cor-borda)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginRight: '6px' };
  const btnEditar = { ...btnAcao, color: 'var(--cor-alerta)' };
  const btnDesativar = { ...btnAcao, color: 'var(--cor-perigo)' };
  const btnReativar = { ...btnAcao, color: 'var(--cor-sucesso)' };
  const btnPrimario = { padding: '11px 22px', background: 'var(--cor-destaque)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' };
  const btnSecundario = { padding: '11px 22px', background: 'transparent', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' };
  const abaStyle = (ativa) => ({ padding: '9px 18px', background: ativa ? 'var(--cor-destaque)' : 'transparent', color: ativa ? '#fff' : 'var(--cor-texto-suave)', border: `1px solid ${ativa ? 'var(--cor-destaque)' : 'var(--cor-borda)'}`, borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s' });

  return (
    <>
      <Header />
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px 16px' }}>
        <h2 style={{ color: 'var(--cor-texto-titulo)' }}><Settings size={24} style={{ marginRight: '8px' }} />Painel do Gestor</h2>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', marginTop: '16px' }}>
          <button onClick={() => handleAbaChange('insumos')} style={abaStyle(aba === 'insumos')}><Package size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Insumos</button>
          <button onClick={() => handleAbaChange('filiais')} style={abaStyle(aba === 'filiais')}><Building2 size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Filiais</button>
          <button onClick={() => handleAbaChange('estoque')} style={abaStyle(aba === 'estoque')}><Settings2 size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Estoque Mínimo</button>
        </div>

        {mensagem && (
          <p style={{ color: ehErro ? 'var(--cor-perigo)' : 'var(--cor-sucesso)', marginBottom: '16px', fontSize: '14px' }}>
            {mensagem}
          </p>
        )}

        {aba === 'insumos' && (
          <div>
            <h3 style={{ marginBottom: '16px', color: 'var(--cor-texto-titulo)' }}>{editandoInsumo ? 'Editar Insumo' : 'Cadastrar Insumo'}</h3>
            <form onSubmit={handleSubmitInsumo} style={{ marginBottom: '32px', background: 'var(--cor-superficie)', border: '1px solid var(--cor-borda)', borderRadius: '12px', padding: '24px' }}>
              <label htmlFor="nome_insumo" style={labelStyle}>Nome do insumo</label>
              <input id="nome_insumo" placeholder="Ex: Papel A4" value={formInsumo.nome} onChange={(e) => setFormInsumo({ ...formInsumo, nome: e.target.value })} required style={inputStyle} />

              <label htmlFor="unidade" style={labelStyle}>Unidade</label>
              <input id="unidade" placeholder="Ex: Resma, Caixa, Litro" value={formInsumo.unidade} onChange={(e) => setFormInsumo({ ...formInsumo, unidade: e.target.value })} required style={inputStyle} />

              <label htmlFor="estoque_minimo" style={labelStyle}>Estoque mínimo</label>
              <input id="estoque_minimo" placeholder="Ex: 10" type="number" min="0" value={formInsumo.estoque_minimo} onChange={(e) => setFormInsumo({ ...formInsumo, estoque_minimo: e.target.value })} required style={inputStyle} />

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={btnPrimario}>
                  {editandoInsumo ? 'Salvar alterações' : 'Cadastrar'}
                </button>
                {editandoInsumo && (
                  <button type="button" onClick={cancelarEdicaoInsumo} style={btnSecundario}>Cancelar</button>
                )}
              </div>
            </form>

            <h3 style={{ marginBottom: '12px', color: 'var(--cor-texto-titulo)' }}>Insumos cadastrados</h3>
            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
              <table style={{ width: '100%', minWidth: '520px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--cor-superficie-2)' }}>
                    <th style={thStyle}>Nome</th>
                    <th style={thStyle}>Unidade</th>
                    <th style={thStyle}>Estoque mínimo</th>
                    <th style={thStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {insumos.map((i) => (
                    <tr key={i.id} style={{ opacity: i.ativo === 'inativo' ? 0.5 : 1 }}>
                      <td style={tdStyle}>
                        {i.nome}
                        {i.ativo === 'inativo' && <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--cor-perigo)' }}>(inativo)</span>}
                      </td>
                      <td style={tdStyle}>{i.unidade}</td>
                      <td style={tdStyle}>{i.estoque_minimo}</td>
                      <td style={tdStyle}>
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
          </div>
        )}

        {aba === 'filiais' && (
          <div>
            <h3 style={{ marginBottom: '16px', color: 'var(--cor-texto-titulo)' }}>{editandoFilial ? 'Editar Filial' : 'Cadastrar Filial'}</h3>
            <form onSubmit={handleSubmitFilial} style={{ marginBottom: '32px', background: 'var(--cor-superficie)', border: '1px solid var(--cor-borda)', borderRadius: '12px', padding: '24px' }}>
              <label htmlFor="nome_filial" style={labelStyle}>Nome da filial</label>
              <input id="nome_filial" placeholder="Ex: WD Botafogo" value={formFilial.nome} onChange={(e) => setFormFilial({ ...formFilial, nome: e.target.value })} required style={inputStyle} />

              <label htmlFor="endereco" style={labelStyle}>Endereço</label>
              <input id="endereco" placeholder="Ex: Rua da Assembleia, 10 - Centro, RJ" value={formFilial.endereco} onChange={(e) => setFormFilial({ ...formFilial, endereco: e.target.value })} required style={inputStyle} />

              <label htmlFor="responsavel" style={labelStyle}>Responsável</label>
              <input id="responsavel" placeholder="Ex: João Silva" value={formFilial.responsavel} onChange={(e) => setFormFilial({ ...formFilial, responsavel: e.target.value })} required style={inputStyle} />

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={btnPrimario}>
                  {editandoFilial ? 'Salvar alterações' : 'Cadastrar'}
                </button>
                {editandoFilial && (
                  <button type="button" onClick={cancelarEdicaoFilial} style={btnSecundario}>Cancelar</button>
                )}
              </div>
            </form>

            <h3 style={{ marginBottom: '12px', color: 'var(--cor-texto-titulo)' }}>Filiais cadastradas</h3>
            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
              <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--cor-superficie-2)' }}>
                    <th style={thStyle}>Nome</th>
                    <th style={thStyle}>Endereço</th>
                    <th style={thStyle}>Responsável</th>
                    <th style={thStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filiais.map((f) => (
                    <tr key={f.id} style={{ opacity: f.ativo === 'inativo' ? 0.5 : 1 }}>
                      <td style={tdStyle}>
                        {f.nome}
                        {f.ativo === 'inativo' && <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--cor-perigo)' }}>(inativo)</span>}
                      </td>
                      <td style={tdStyle}>{f.endereco}</td>
                      <td style={tdStyle}>{f.responsavel}</td>
                      <td style={tdStyle}>
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
          </div>
        )}

        {aba === 'estoque' && (
          <div>
            <h3 style={{ marginBottom: '16px', color: 'var(--cor-texto-titulo)' }}>
              Configurar Estoque Mínimo por Filial
            </h3>

            <form onSubmit={handleSubmitEstoqueMinimo} style={{ marginBottom: '32px', background: 'var(--cor-superficie)', border: '1px solid var(--cor-borda)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="filial_id" style={labelStyle}>Filial</label>
                <select
                  id="filial_id"
                  value={formEstoqueMinimo.filial_id}
                  onChange={(e) => setFormEstoqueMinimo({ ...formEstoqueMinimo, filial_id: e.target.value })}
                  required
                  style={inputStyle}
                >
                  <option value="">Selecione a filial...</option>
                  {filiais.filter(f => f.ativo !== 'inativo').map((f) => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="insumo_id_estoque" style={labelStyle}>Insumo</label>
                <SeletorInsumo
                  insumos={insumos}
                  valor={formEstoqueMinimo.insumo_id}
                  onChange={(value) => setFormEstoqueMinimo({ ...formEstoqueMinimo, insumo_id: value })}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="estoque_minimo_filial" style={labelStyle}>Estoque Mínimo</label>
                <input
                  id="estoque_minimo_filial"
                  type="number"
                  placeholder="Ex: 10"
                  value={formEstoqueMinimo.estoque_minimo}
                  onChange={(e) => setFormEstoqueMinimo({ ...formEstoqueMinimo, estoque_minimo: e.target.value })}
                  required
                  min="0"
                  style={inputStyle}
                />
                <p style={{ fontSize: '12px', color: 'var(--cor-texto-suave)', marginTop: '-8px' }}>
                  <AlertCircle size={14} /> Este valor substitui o estoque mínimo global do insumo para esta filial específica.
                </p>
              </div>

              <button type="submit" style={btnPrimario}>
                Configurar
              </button>
            </form>

            <h3 style={{ marginBottom: '12px', color: 'var(--cor-texto-titulo)' }}>
              Configurações ativas
            </h3>

            {estoquesMinimos.length === 0 ? (
              <p style={{ color: 'var(--cor-texto-suave)', textAlign: 'center', padding: '32px 0' }}>
                Nenhuma configuração personalizada. Todas as filiais usam o estoque mínimo global dos insumos.
              </p>
            ) : (
              <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--cor-superficie-2)' }}>
                      <th style={thStyle}>Filial</th>
                      <th style={thStyle}>Insumo</th>
                      <th style={thStyle}>Estoque Mínimo</th>
                      <th style={thStyle}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estoquesMinimos.map((e) => {
                      const filial = filiais.find(f => f.id === e.filial_id);
                      const insumo = insumos.find(i => i.id === e.insumo_id);
                      const globalMin = insumo ? insumo.estoque_minimo : '—';

                      return (
                        <tr key={`${e.filial_id}-${e.insumo_id}`}>
                          <td style={tdStyle}>{filial ? filial.nome : e.filial_id}</td>
                          <td style={tdStyle}>{insumo ? insumo.nome : e.insumo_id}</td>
                          <td style={{ ...tdStyle, fontWeight: '500', color: 'var(--cor-destaque)' }}>
                            {e.estoque_minimo}
                            {globalMin !== '—' && (
                              <span style={{ fontSize: '11px', color: 'var(--cor-texto-suave)', marginLeft: '8px' }}>
                                (global: {globalMin})
                              </span>
                            )}
                          </td>
                          <td style={tdStyle}>
                            <button
                              onClick={async () => {
                                if (!confirm(`Remover configuração para ${filial?.nome} - ${insumo?.nome}?`)) return;
                                try {
                                  await api.delete(`/estoque-minimo/${e.filial_id}/${e.insumo_id}`);
                                  setMensagem('Configuração removida com sucesso!');
                                  setEhErro(false);
                                  const res = await api.get('/estoque-minimo');
                                  setEstoquesMinimos(res.data);
                                } catch (error) {
                                  setMensagem(error.response?.data?.error || 'Erro ao remover configuração.');
                                  setEhErro(true);
                                }
                              }}
                              style={btnDesativar}
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}