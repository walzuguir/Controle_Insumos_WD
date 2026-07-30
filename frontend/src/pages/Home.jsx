import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  User,
  Package,
  BarChart3,
  AlertTriangle,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  LayoutDashboard,
  House,
  Clock,
  ChevronRight,
} from "lucide-react";
import api from "../services/api";
import Header from "../components/Header";

export default function Home() {
  const [filiais, setFiliais] = useState([]);
  const [saldos, setSaldos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const ehGestor = usuario?.filial_id === "gestor";
  const filiaisParaMostrar = ehGestor
    ? filiais
    : filiais.filter((f) => f.id === usuario?.filial_id);

  useEffect(() => {
    api.get("/filiais").then((res) => setFiliais(res.data));
    api.get("/saldos").then((res) => setSaldos(res.data));
    api.get("/insumos").then((res) => setInsumos(res.data));
    api.get("/movimentacoes").then((res) => setMovimentacoes(res.data));
  }, []);

  const nomeInsumo = (id) => {
    const insumo = insumos.find((i) => i.id === id);
    return insumo ? insumo.nome : "Insumo não encontrado";
  };

  const nomeFilial = (id) => {
    if (!id) return "Não informado";
    const filial = filiais.find((f) => f.id === id);
    return filial ? filial.nome : "Fornecedor";
  };

  const ultimasMovimentacoes = [...movimentacoes].reverse().slice(0, 5);

  const atalhos = [
    { nome: "Registrar Entrada", rota: "/entrada", cor: "#2563eb" },
    { nome: "Registrar Saída", rota: "/saida", cor: "#dc2626" },
    { nome: "Dashboard", rota: "/dashboard", cor: "#16a34a" },
    { nome: "Relatório", rota: "/relatorio", cor: "#9333ea" },
  ];

  if (ehGestor) {
    atalhos.push(
      { nome: "Painel de GAPs", rota: "/gaps", cor: "#d97706" },
      { nome: "Painel do Gestor", rota: "/gestor", cor: "#0891b2" },
    );
  }

  return (
    <>
      <Header />
      <div
        style={{ maxWidth: "900px", margin: "0 auto", padding: "20px 16px" }}
      >
        <h2 style={{ color: "var(--cor-texto-titulo)" }}>
          <House
            size={20}
            style={{ marginRight: "8px", verticalAlign: "middle" }}
          />
          Bem-vindo, {usuario?.nome}!
        </h2>

        {/* CARDS DAS FILIAIS */}
        <h3 style={{ marginBottom: "16px", color: "var(--cor-texto-titulo)" }}>
          <Building2
            size={18}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          {ehGestor ? "Filiais" : "Minha Filial"}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {filiaisParaMostrar.map((f) => {
            const saldosFilial = saldos.filter((s) => s.filial_id === f.id);
            const criticos = saldosFilial.filter(
              (s) => s.status === "critico",
            ).length;
            const totalInsumos = saldosFilial.length;
            const totalEstoque = saldosFilial.reduce(
              (acc, s) => acc + s.saldo,
              0,
            );

            return (
              <div
                key={f.id}
                onClick={() => navigate(`/dashboard?filial=${f.id}`)}
                style={{
                  padding: "28px 24px",
                  background: "var(--cor-superficie)",
                  border: "1px solid var(--cor-borda)",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.06)";
                  e.currentTarget.style.borderColor = "var(--cor-destaque)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 1px 3px rgba(0,0,0,0.04)";
                  e.currentTarget.style.borderColor = "var(--cor-borda)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Building2
                      size={18}
                      strokeWidth={1.5}
                      color="var(--cor-texto-titulo)"
                    />
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "var(--cor-texto-titulo)",
                      }}
                    >
                      {f.nome}
                    </h3>
                  </div>
                  {criticos > 0 && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--cor-perigo)",
                        background: "var(--cor-perigo-bg)",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontWeight: "500",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <AlertTriangle size={12} strokeWidth={2} />
                      {criticos} {criticos > 1}
                    </span>
                  )}
                </div>

                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--cor-texto-suave)",
                    margin: "6px 0 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <User size={13} strokeWidth={1.5} />
                  {f.responsavel || "Sem responsável"}
                </p>

                <div style={{ display: "flex", gap: "24px" }}>
                  <div>
                    <p
                      style={{
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        color: "var(--cor-texto-suave)",
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Package size={12} strokeWidth={1.5} />
                      Insumos
                    </p>
                    <p
                      style={{
                        fontSize: "18px",
                        fontWeight: "500",
                        margin: 0,
                        color: "var(--cor-texto-titulo)",
                      }}
                    >
                      {totalInsumos}
                    </p>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        color: "var(--cor-texto-suave)",
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <BarChart3 size={12} strokeWidth={1.5} />
                      Estoque
                    </p>
                    <p
                      style={{
                        fontSize: "18px",
                        fontWeight: "500",
                        margin: 0,
                        color: "var(--cor-texto-titulo)",
                      }}
                    >
                      {totalEstoque}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    right: "16px",
                    fontSize: "11px",
                    color: "var(--cor-texto-suave)",
                    opacity: 0.5,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Ver estoque
                  <ChevronRight size={14} strokeWidth={1.5} />
                </div>
              </div>
            );
          })}
        </div>

        <h3 style={{ marginBottom: "16px", color: "var(--cor-texto-titulo)" }}>
          <LayoutDashboard
            size={18}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          Acesso rápido
        </h3>
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "32px",
          }}
        >
          {/* Só gestor vê Cadastrar Insumo */}
          {ehGestor && (
            <button
              onClick={() => navigate("/gestor?aba=insumos")}
              style={{
                padding: "12px 24px",
                background: "var(--cor-destaque)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Plus size={18} />
              Cadastrar Insumo
            </button>
          )}

          {/* Só gestor vê Cadastrar Filial */}
          {ehGestor && (
            <button
              onClick={() => navigate("/gestor?aba=filiais")}
              style={{
                padding: "12px 24px",
                background: "var(--cor-alerta)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Building2 size={18} />
              Cadastrar Filial
            </button>
          )}

          {/* Só gestor vê Registrar Entrada */}
          {ehGestor && (
            <button
              onClick={() => navigate("/entrada")}
              style={{
                padding: "12px 24px",
                background: "var(--cor-sucesso)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ArrowDownCircle size={18} />
              Registrar Entrada
            </button>
          )}

          {/* Registrar Saída – visível para todos os perfis */}
          <button
            onClick={() => navigate("/saida")}
            style={{
              padding: "12px 24px",
              background: "var(--cor-perigo)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <ArrowUpCircle size={18} />
            Registrar Saída
          </button>
        </div>

        <h3 style={{ marginBottom: "16px", color: "var(--cor-texto-titulo)" }}>
          <Clock
            size={18}
            style={{ marginRight: "6px", verticalAlign: "middle" }}
          />
          Últimas movimentações
        </h3>
        <div
          style={{ overflowX: "auto", maxWidth: "100%", marginBottom: "32px" }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--cor-superficie-2)" }}>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "left",
                    border: "1px solid var(--cor-borda)",
                    color: "var(--cor-texto-suave)",
                    fontSize: "13px",
                  }}
                >
                  Data
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "left",
                    border: "1px solid var(--cor-borda)",
                    color: "var(--cor-texto-suave)",
                    fontSize: "13px",
                  }}
                >
                  Insumo
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "left",
                    border: "1px solid var(--cor-borda)",
                    color: "var(--cor-texto-suave)",
                    fontSize: "13px",
                  }}
                >
                  Tipo
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "left",
                    border: "1px solid var(--cor-borda)",
                    color: "var(--cor-texto-suave)",
                    fontSize: "13px",
                  }}
                >
                  Origem
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "left",
                    border: "1px solid var(--cor-borda)",
                    color: "var(--cor-texto-suave)",
                    fontSize: "13px",
                  }}
                >
                  Destino
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "left",
                    border: "1px solid var(--cor-borda)",
                    color: "var(--cor-texto-suave)",
                    fontSize: "13px",
                  }}
                >
                  Qtd
                </th>
              </tr>
            </thead>
            <tbody>
              {ultimasMovimentacoes.map((m) => (
                <tr key={m.id}>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid var(--cor-borda)",
                    }}
                  >
                    {new Date(m.data).toLocaleString("pt-BR")}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid var(--cor-borda)",
                    }}
                  >
                    {nomeInsumo(m.insumo_id)}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid var(--cor-borda)",
                      color:
                        m.tipo === "entrada"
                          ? "var(--cor-sucesso)"
                          : "var(--cor-perigo)",
                    }}
                  >
                    {m.tipo}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid var(--cor-borda)",
                    }}
                  >
                    {nomeFilial(m.filial_origem)}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid var(--cor-borda)",
                    }}
                  >
                    {m.tipo === "saida" && m.filial_destino === ""
                      ? "Consumo"
                      : nomeFilial(m.filial_destino)}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid var(--cor-borda)",
                    }}
                  >
                    {m.quantidade}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
