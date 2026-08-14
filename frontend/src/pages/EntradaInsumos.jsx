import { useState, useEffect } from "react";
import Header from "../components/Header";
import api from "../services/api";
import { ArrowUpCircle } from 'lucide-react';
import SeletorInsumo from "../components/SeletorInsumo";

export default function EntradaInsumos() {
  const [insumos, setInsumos] = useState([]);
  const [filiais, setFiliais] = useState([]);
  const [form, setForm] = useState({
    insumo_id: "",
    quantidade: "",
    nota_fiscal: "",
    unidade: "",
    origem: "Fornecedor",
    filial_destino: "",
    observacao: "",
    requisitante: "",
  });
  const [mensagem, setMensagem] = useState("");
  const [ehErro, setEhErro] = useState(false);
  const [loading, setLoading] = useState(false);
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const ehGestor = usuario?.filial_id === 'gestor';

  useEffect(() => {
    api.get("/insumos").then((res) => setInsumos(res.data));
    if (ehGestor) {
      api.get("/filiais").then((res) => setFiliais(res.data));
    }
  }, [ehGestor]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (mensagem) {
      setMensagem('');
      setEhErro(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem('');
    setEhErro(false);
    setLoading(true);

    if (!form.insumo_id || !form.quantidade) {
      setMensagem("Preencha todos os campos obrigatórios.");
      setEhErro(true);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        tipo: "entrada",
        insumo_id: form.insumo_id,
        quantidade: form.quantidade,
        nota_fiscal: form.nota_fiscal || "",
        requisitante: form.requisitante || "",
      };

      if (ehGestor) {
        // Gestor: precisa selecionar a filial destino
        if (!form.filial_destino) {
          setMensagem("Selecione a filial de destino.");
          setEhErro(true);
          setLoading(false);
          return;
        }
        payload.filial_destino = form.filial_destino;
      } else {
        // ✅ Responsável: usa a filial do usuário
        payload.filial_destino = usuario?.filial_id; // ← USANDO usuario (já definido)
      }

      const response = await api.post("/movimentacoes", payload);

      setMensagem("Entrada registrada com sucesso!");
      setEhErro(false);
      setForm({
        insumo_id: "",
        quantidade: "",
        nota_fiscal: "",
        filial_destino: "",
        observacao: "",
        requisitante: "",
      });
    } catch (error) {
      setMensagem(error.response?.data?.error || "Erro ao registrar entrada.");
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
          <h2 style={{ color: 'var(--cor-texto-titulo)', marginTop: 0, marginBottom: '24px' }}><ArrowUpCircle size={24} /> Registrar Entrada de Insumo</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="insumo_id" style={labelStyle}>Insumo</label>
              <SeletorInsumo
                insumos={insumos}
                valor={form.insumo_id}
                onChange={(value) => {
                  setForm({ ...form, insumo_id: value });
                  if (mensagem) {
                    setMensagem('');
                    setEhErro(false);
                  }
                }}
              />
            </div>

            {ehGestor && (
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="filial_destino" style={labelStyle}>Filial de Destino</label>
                <select
                  name="filial_destino"
                  id="filial_destino"
                  value={form.filial_destino}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Selecione a filial...</option>
                  {filiais.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
                <p style={{ fontSize: '12px', color: 'var(--cor-texto-suave)', marginTop: '4px' }}>
                  Selecione para qual filial o insumo será direcionado
                </p>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="quantidade" style={labelStyle}>Quantidade</label>
              <input type="number" name="quantidade" id="quantidade" value={form.quantidade} onChange={handleChange} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="nota_fiscal" style={labelStyle}>Nota Fiscal (opcional)</label>
              <input type="text" name="nota_fiscal" id="nota_fiscal" value={form.nota_fiscal} onChange={handleChange} placeholder="Ex: 000123456" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="requisitante" style={labelStyle}>Requisitante (opcional)</label>
              <input type="text" name="requisitante" id="requisitante" value={form.requisitante} onChange={handleChange} placeholder="Nome do requisitante" style={inputStyle} />
            </div>

            {mensagem && (
              <p style={{ color: ehErro ? 'var(--cor-perigo)' : 'var(--cor-sucesso)', fontSize: '14px', marginBottom: '16px' }}>
                {mensagem}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '11px', background: 'var(--cor-destaque)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cor-destaque-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--cor-destaque)'}
            >
              {loading ? 'Registrando...' : (
                <>
                  <ArrowUpCircle size={18} /> Registrar Entrada
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
