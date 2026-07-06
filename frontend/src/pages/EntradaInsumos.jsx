import { useState, useEffect } from "react";
import Header from "../components/Header";
import api from "../services/api";

export default function EntradaInsumos() {
  const [insumos, setInsumos] = useState([]);
  const [form, setForm] = useState({
    insumo_id: "",
    quantidade: "",
    unidade: "",
    origem: "fornecedor",
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
        filial_origem: form.origem,
        filial_destino: usuario.filial_id,
        quantidade: form.quantidade,
        responsavel_id: usuario.id,
      });
      setMensagem("Entrada registrada com sucesso!");
      setForm({
        insumo_id: "",
        quantidade: "",
        unidade: "",
        origem: "fornecedor",
        observacao: "",
      });
    } catch {
      setMensagem("Erro ao registrar entrada.");
    }
  };

  return (
    <>
    <Header />
    <div style={{ maxWidth: "500px", margin: "40px auto", padding: "32px" }}>
      <h2>Registrar Entrada de Insumo</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="insumo_id" style={{ fontSize: "14px", fontWeight: "500", color: "#436eb3" }}>
            Insumo
          </label>
          <select
            name="insumo_id"
            id="insumo_id"
            value={form.insumo_id}
            onChange={handleChange}
            style={{
              display: "block",
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px'
            }}
          >
            <option value="">Selecione...</option>
            {insumos.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="quantidade" style={{ fontSize: "14px", fontWeight: "500", color: "#436eb3" }}>
            Quantidade
          </label>
          <input
            type="number"
            name="quantidade"
            id="quantidade"
            value={form.quantidade}
            onChange={handleChange}
            style={{
              display: "block",
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px'
            }}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="origem" style={{ fontSize: "14px", fontWeight: "500", color: "#436eb3" }}>
            Origem
          </label>
          <select
            name="origem"
            id="origem"
            value={form.origem}
            onChange={handleChange}
            style={{
              display: "block",
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px'
            }}
          >
            <option value="fornecedor">Fornecedor</option>
            <option value="CD">CD (Centro de Distribuição)</option>
          </select>
        </div>
        {mensagem && <p style={{ color: "green" }}>{mensagem}</p>}
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Registrar Entrada
        </button>
      </form>
    </div>
    </>
  );
}
