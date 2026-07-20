import { useState, useEffect } from "react";
import Header from "../components/Header";
import api from "../services/api";

export default function EntradaInsumos() {
  const [insumos, setInsumos] = useState([]);
  const [form, setForm] = useState({
    insumo_id: "",
    quantidade: "",
    nota_fiscal: "",
    unidade: "",
    origem: "Fornecedor",
    observacao: "",
  });
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    api.get("/insumos").then((res) => setInsumos(res.data));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      await api.post("/movimentacoes", {
        tipo: "entrada",
        insumo_id: form.insumo_id,
        filial_origem: "fornecedor",
        filial_destino: "1",
        quantidade: form.quantidade,
        responsavel_id: usuario.id,
        nota_fiscal: form.nota_fiscal,
      });
      setMensagem("Entrada registrada com sucesso!");
      setForm({
        insumo_id: "",
        quantidade: "",
        nota_fiscal: "",
        unidade: "",
        origem: "fornecedor",
        observacao: "",
      });
    } catch {
      setMensagem("Erro ao registrar entrada.");
    }
  };

  const labelStyle = { fontSize: '14px', fontWeight: '500', color: 'var(--cor-texto-suave)' };
  const inputStyle = { display: 'block', width: '100%', padding: '10px', marginTop: '6px', background: 'var(--cor-superficie-2)', border: '1px solid var(--cor-borda)', borderRadius: '6px', fontSize: '14px', color: 'var(--cor-texto)' };

  return (
    <>
      <Header />
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px 16px' }}>
        <div style={{ background: 'var(--cor-superficie)', border: '1px solid var(--cor-borda)', borderRadius: '12px', padding: '28px' }}>
          <h2 style={{ color: 'var(--cor-texto-titulo)', marginTop: 0, marginBottom: '24px' }}>Registrar Entrada de Insumo</h2>
          <form onSubmit={handleSubmit}>
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
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="nota_fiscal" style={labelStyle}>Nota Fiscal (opcional)</label>
              <input type="text" name="nota_fiscal" id="nota_fiscal" value={form.nota_fiscal} onChange={handleChange} placeholder="Ex: 000123456" style={inputStyle} />
            </div>
            {mensagem && (
              <p style={{ color: mensagem.includes('Erro') ? 'var(--cor-perigo)' : 'var(--cor-sucesso)', fontSize: '14px', marginBottom: '16px' }}>
                {mensagem}
              </p>
            )}
            <button
              type="submit"
              style={{ width: '100%', padding: '11px', background: 'var(--cor-destaque)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cor-destaque-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--cor-destaque)'}
            >
              Registrar Entrada
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
