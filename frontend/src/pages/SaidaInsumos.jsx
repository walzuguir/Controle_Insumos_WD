import { useState, useEffect } from 'react';
import api from '../services/api';
import Header from '../components/Header';

export default function SaidaInsumos() {
  const [insumos, setInsumos] = useState([]);
  const [filiais, setFiliais] = useState([]);
  const [form, setForm] = useState({
    tipo: 'saida',
    insumo_id: '',
    quantidade: '',
    filial_destino: '',
  });
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/insumos').then((res) => setInsumos(res.data));
    api.get('/filiais').then((res) => setFiliais(res.data));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem('');
    setLoading(true);

    if (!form.insumo_id || !form.quantidade) {
      setMensagem('Preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    if (form.tipo === 'transferencia' && !form.filial_destino) {
      setMensagem('Selecione a filial destino para transferência.');
      setLoading(false);
      return;
    }

    try {
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      await api.post('/movimentacoes', {
        tipo: form.tipo,
        insumo_id: form.insumo_id,
        filial_origem: usuario.filial_id,
        filial_destino: form.tipo === 'transferencia' ? form.filial_destino : '',
        quantidade: form.quantidade,
        responsavel_id: usuario.id,
      });

      setMensagem(form.tipo === 'transferencia' ? 'Transferência registrada com sucesso!' : 'Saída registrada com sucesso!');
      setForm({ tipo: 'saida', insumo_id: '', quantidade: '', filial_destino: '' });
    } catch {
      setMensagem('Erro ao registrar saída.');
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = { fontSize: '14px', fontWeight: '500', color: '#374151' };
  const inputStyle = { display: 'block', width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' };

  return (
    <>
      <Header />
      <div style={{ maxWidth: '500px', margin: '40px auto', padding: '32px' }}>
        <h2>Registrar Saída de Insumo</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="tipo" style={labelStyle}>Tipo</label>
            <select name="tipo" id="tipo" value={form.tipo} onChange={handleChange} style={inputStyle}>
              <option value="saida">Consumo na filial</option>
              <option value="transferencia">Transferência CD → Filial</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="insumo_id" style={labelStyle}>Insumo</label>
            <select name="insumo_id" id="insumo_id" value={form.insumo_id} onChange={handleChange} style={inputStyle}>
              <option value="">Selecione...</option>
              {insumos.map((i) => (
                <option key={i.id} value={i.id}>{i.nome}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="quantidade" style={labelStyle}>Quantidade</label>
            <input type="number" name="quantidade" id="quantidade" value={form.quantidade} onChange={handleChange} style={inputStyle} />
          </div>

          {form.tipo === 'transferencia' && (
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="filial_destino" style={labelStyle}>Filial destino</label>
              <select name="filial_destino" id="filial_destino" value={form.filial_destino} onChange={handleChange} style={inputStyle}>
                <option value="">Selecione...</option>
                {filiais.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </div>
          )}

          {mensagem && (
            <p style={{ color: mensagem.includes('Erro') || mensagem.includes('Preencha') || mensagem.includes('Selecione') ? 'red' : 'green', marginBottom: '16px' }}>
              {mensagem}
            </p>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: loading ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Registrando...' : 'Registrar Saída'}
          </button>
        </form>
      </div>
    </>
  );
}