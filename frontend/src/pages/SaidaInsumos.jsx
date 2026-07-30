import { useState, useEffect, useMemo } from 'react';import api from '../services/api';
import Header from '../components/Header';
import { ArrowDownCircle, AlertTriangle } from 'lucide-react';

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
  const [ehErro, setEhErro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saldos, setSaldos] = useState([]);

  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const ehGestor = usuario?.filial_id === 'gestor';

  useEffect(() => {
    api.get('/insumos').then((res) => setInsumos(res.data));
    api.get('/filiais').then((res) => setFiliais(res.data));
    api.get('/saldos').then((res) => setSaldos(res.data));
  }, []);

  const saldoDisponivel = useMemo(() => {
  if (form.insumo_id && (ehGestor ? form.filial_origem : usuario?.filial_id)) {
    const filialId = ehGestor ? form.filial_origem : usuario?.filial_id;
    const saldo = saldos.find(s =>
      s.insumo_id === form.insumo_id && s.filial_id === filialId
    );
    return saldo ? saldo.saldo : 0;
  }
  return null;
}, [form.insumo_id, form.filial_origem, saldos, ehGestor, usuario?.filial_id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem('');
    setEhErro(false);
    setLoading(true);

    if (!form.insumo_id || !form.quantidade) {
      setMensagem('Preencha todos os campos obrigatórios.');
      setEhErro(true);
      setLoading(false);
      return;
    }

    if (ehGestor && !form.filial_origem) {
      setMensagem('Selecione a filial de origem.');
      setEhErro(true);
      setLoading(false);
      return;
    }

    if (form.tipo === 'transferencia' && !form.filial_destino) {
      setMensagem('Selecione a filial destino para transferência.');
      setEhErro(true);
      setLoading(false);
      return;
    }

    if (saldoDisponivel !== null && parseFloat(form.quantidade) > saldoDisponivel) {
      setMensagem(`Saldo insuficiente. Disponível: ${saldoDisponivel}`);
      setEhErro(true);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        tipo: form.tipo,
        insumo_id: form.insumo_id,
        quantidade: form.quantidade,
      };

      if (ehGestor) {
        payload.filial_origem = form.filial_origem;
      }

      if (form.tipo === 'transferencia') {
        payload.filial_destino = form.filial_destino;
      }

      await api.post('/movimentacoes', payload);

      setMensagem(form.tipo === 'transferencia' ? 'Transferência registrada com sucesso!' : 'Saída registrada com sucesso!');
      setForm({
        tipo: 'saida',
        insumo_id: '',
        quantidade: '',
        filial_origem: '',
        filial_destino: ''
      });
      const saldosAtualizados = await api.get('/saldos');
      setSaldos(saldosAtualizados.data);
    } catch (error) {
      setMensagem(error.response?.data?.error || 'Erro ao registrar saída.');
      setEhErro(true);
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = { fontSize: '14px', fontWeight: '500', color: 'var(--cor-texto-suave)' };
  const inputStyle = { display: 'block', width: '100%', padding: '10px', marginTop: '6px', background: 'var(--cor-superficie-2)', border: '1px solid var(--cor-borda)', borderRadius: '6px', fontSize: '14px', color: 'var(--cor-texto)' };

  return (
    <>
      <Header />
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px 16px' }}>
        <div style={{ background: 'var(--cor-superficie)', border: '1px solid var(--cor-borda)', borderRadius: '12px', padding: '28px' }}>
          <h2 style={{ color: 'var(--cor-texto-titulo)', marginTop: 0, marginBottom: '24px' }}><ArrowDownCircle size={24} /> Registrar Saída de Insumo</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="tipo" style={labelStyle}>Tipo</label>
              <select name="tipo" id="tipo" value={form.tipo} onChange={handleChange} style={inputStyle}>
                <option value="saida">Consumo na filial</option>
                <option value="transferencia">Transferência CD → Filial</option>
              </select>
            </div>

            {ehGestor && (
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="filial_origem" style={labelStyle}>Filial de Origem</label>
                <select
                  name="filial_origem"
                  id="filial_origem"
                  value={form.filial_origem}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Selecione a filial...</option>
                  {filiais.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>
            )}

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

            {saldoDisponivel !== null && (
              <div style={{
                marginBottom: '16px',
                padding: '8px 12px',
                background: 'var(--cor-superficie-2)',
                borderRadius: '6px',
                fontSize: '13px',
                color: saldoDisponivel < parseFloat(form.quantidade || 0) ? 'var(--cor-perigo)' : 'var(--cor-sucesso)'
              }}>
                  <AlertTriangle size={16} /> Saldo disponível: <strong>{saldoDisponivel}</strong> unidades
              </div>
            )}

            {form.tipo === 'transferencia' && (
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="filial_destino" style={labelStyle}>Filial destino</label>
                <select name="filial_destino" id="filial_destino" value={form.filial_destino} onChange={handleChange} style={inputStyle}>
                  <option value="">Selecione...</option>
                  {filiais.filter(f => f.id !== '1').map((f) => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {mensagem && (
              <p style={{ color: ehErro ? 'var(--cor-perigo)' : 'var(--cor-sucesso)', fontSize: '14px', marginBottom: '16px' }}>
                {mensagem}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || (saldoDisponivel !== null && form.quantidade && parseFloat(form.quantidade) > saldoDisponivel)}
              style={{
                width: '100%',
                padding: '11px',
                background: (loading || (saldoDisponivel !== null && form.quantidade && parseFloat(form.quantidade) > saldoDisponivel))
                  ? 'var(--cor-superficie-2)'
                  : 'var(--cor-destaque)',
                color: (loading || (saldoDisponivel !== null && form.quantidade && parseFloat(form.quantidade) > saldoDisponivel))
                  ? 'var(--cor-texto-suave)'
                  : '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: (loading || (saldoDisponivel !== null && form.quantidade && parseFloat(form.quantidade) > saldoDisponivel))
                  ? 'not-allowed'
                  : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background 0.2s'
              }}
            >
              {loading ? 'Registrando...' :(
                <>
                  <ArrowDownCircle size={18} /> Registrar Saída
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}