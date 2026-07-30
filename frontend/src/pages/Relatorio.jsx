import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import Header from "../components/Header";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Package,
  ArrowRightLeft,
  BarChart3,
  Filter,
  Download,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export default function Relatorio() {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [filiais, setFiliais] = useState([]);
  const [filtros, setFiltros] = useState({
    filial: "",
    insumo_id: "",
    tipo: "",
    data_inicio: "",
    data_fim: "",
    origem: "",
  });
  const [loading, setLoading] = useState(false);
  const [resumo, setResumo] = useState({
    consumo: 0,
    transferencia: 0,
    total: 0,
  });

  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const ehGestor = usuario?.filial_id === "gestor";

  const calcularResumo = useCallback((dados) => {
    const consumo = dados
      .filter((m) => m.tipo === "saida" && m.filial_destino === "")
      .reduce((acc, m) => acc + parseFloat(m.quantidade || 0), 0);

    const transferencia = dados
      .filter(
        (m) =>
          m.tipo === "transferencia" ||
          (m.tipo === "saida" && m.filial_destino !== ""),
      )
      .reduce((acc, m) => acc + parseFloat(m.quantidade || 0), 0);

    const total = dados.reduce(
      (acc, m) => acc + parseFloat(m.quantidade || 0),
      0,
    );

    setResumo({ consumo, transferencia, total });
  }, []);

  const buscar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const filtrosFinais = { ...filtros };
      if (!ehGestor) {
        filtrosFinais.filial = usuario.filial_id;
      }
      Object.entries(filtrosFinais).forEach(([k, v]) => {
        if (v && k !== "origem") params.append(k, v);
      });

      const res = await api.get(`/movimentacoes?${params.toString()}`);
      let dados = res.data;

      if (filtros.origem === "consumo") {
        dados = dados.filter(
          (m) => m.tipo === "saida" && m.filial_destino === '',
        );
      } else if (filtros.origem === "transferencia") {
        dados = dados.filter(
          (m) =>
            m.tipo === "transferencia" ||
            (m.tipo === "saida" && m.filial_destino !== ""),
        );
      }

      setMovimentacoes(dados);
      calcularResumo(dados);
    } catch (error) {
      console.error("Erro ao buscar movimentações:", error);
    } finally {
      setLoading(false);
    }
  }, [filtros, ehGestor, usuario?.filial_id, calcularResumo]);

  useEffect(() => {
    const carregarDadosIniciais = async () => {
      try {
        const [insumosRes, filiaisRes, usuariosRes] = await Promise.all([
          api.get("/insumos"),
          api.get("/filiais"),
          api.get("/auth/usuarios"),
        ]);
        setInsumos(insumosRes.data);
        setFiliais(filiaisRes.data);
        setUsuarios(usuariosRes.data);
        await buscar();
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      }
    };
    carregarDadosIniciais();
  }, [buscar]);

  const handleFiltro = (e) =>
    setFiltros({ ...filtros, [e.target.name]: e.target.value });

  const nomeFilia = (id) => filiais.find((f) => f.id === id)?.nome || id;
  const nomeInsumo = (id) => insumos.find((i) => i.id === id)?.nome || id;
  const nomeResponsavel = (id) => usuarios.find((u) => u.id === id)?.nome || id;

  const getDadosGrafico = () => {
    const consumoPorInsumo = {};
    movimentacoes
      .filter((m) => m.tipo === "saida" && m.filial_destino === "") // ← consumo real
      .forEach((m) => {
        const nome = nomeInsumo(m.insumo_id);
        consumoPorInsumo[nome] =
          (consumoPorInsumo[nome] || 0) + parseFloat(m.quantidade || 0);
      });

    // Ordena do maior para o menor e pega os 10 primeiros
    const sorted = Object.entries(consumoPorInsumo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      labels: sorted.map(([nome]) => nome),
      datasets: [
        {
          label: "Consumo (unidades)",
          data: sorted.map(([, qtd]) => qtd),
          backgroundColor: "rgba(220, 38, 38, 0.6)",
          borderColor: "rgba(220, 38, 38, 1)",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  };

  const exportarCSV = () => {
    const headers = [
      "Data",
      "Tipo",
      "Insumo",
      "Origem",
      "Destino",
      "Quantidade",
      "Nota Fiscal",
      "Responsável",
      "Categoria",
    ];
    const linhas = movimentacoes.map((m) => {
      const isConsumo = m.tipo === "saida" && m.filial_destino === "";
      const isTransferencia =
        m.tipo === "transferencia" ||
        (m.tipo === "saida" && m.filial_destino !== "");

      let categoria = "Movimentação";
      if (isConsumo) categoria = "Consumo";
      else if (isTransferencia) categoria = "Transferência";

      return [
        new Date(m.data).toLocaleString("pt-BR"),
        m.tipo,
        nomeInsumo(m.insumo_id),
        nomeFilia(m.filial_origem),
        m.tipo === "saida" && m.filial_destino === ""
          ? "Consumo"
          : nomeFilia(m.filial_destino),
        m.quantidade,
        m.nota_fiscal || "",
        nomeResponsavel(m.responsavel_id),
        categoria,
      ];
    });
    const csv = [headers, ...linhas].map((row) => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `movimentacoes_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Styles
  const filterStyle = {
    padding: "9px",
    background: "var(--cor-superficie-2)",
    border: "1px solid var(--cor-borda)",
    borderRadius: "6px",
    fontSize: "14px",
    color: "var(--cor-texto)",
  };
  const thStyle = {
    padding: "10px",
    textAlign: "left",
    border: "1px solid var(--cor-borda)",
    color: "var(--cor-texto-suave)",
    fontSize: "13px",
    fontWeight: "500",
  };
  const tdStyle = { padding: "10px", border: "1px solid var(--cor-borda)" };
  const cardStyle = {
    padding: "16px 20px",
    background: "var(--cor-superficie)",
    border: "1px solid var(--cor-borda)",
    borderRadius: "10px",
    flex: "1",
    minWidth: "150px",
  };

  return (
    <>
      <Header />
      <div
        style={{ maxWidth: "900px", margin: "0 auto", padding: "20px 16px" }}
      >
        <h2
          style={{
            color: "var(--cor-texto-titulo)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <BarChart3 size={24} />
          Relatório de Movimentações
        </h2>

        {/* Filtros */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "24px",
            marginTop: "16px",
            alignItems: "center",
          }}
        >
          {ehGestor && (
            <select
              name="filial"
              value={filtros.filial}
              onChange={handleFiltro}
              style={filterStyle}
            >
              <option value="">Todas as filiais</option>
              {filiais.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          )}

          <select
            name="insumo_id"
            value={filtros.insumo_id}
            onChange={handleFiltro}
            style={filterStyle}
          >
            <option value="">Todos os insumos</option>
            {insumos.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </select>

          <select
            name="tipo"
            value={filtros.tipo}
            onChange={handleFiltro}
            style={filterStyle}
          >
            <option value="">Todos os tipos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>

          <select
            name="origem"
            value={filtros.origem}
            onChange={handleFiltro}
            style={filterStyle}
          >
            <option value="">Todas as movimentações</option>
            <option value="consumo">📊 Apenas Consumo</option>
            <option value="transferencia">🔄 Apenas Transferências</option>
          </select>

          <input
            type="date"
            name="data_inicio"
            value={filtros.data_inicio}
            onChange={handleFiltro}
            style={filterStyle}
          />
          <input
            type="date"
            name="data_fim"
            value={filtros.data_fim}
            onChange={handleFiltro}
            style={filterStyle}
          />

          <div
            style={{
              display: "flex",
              gap: "8px",
              width: "100%",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={buscar}
              style={{
                padding: "9px 18px",
                background: "var(--cor-destaque)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--cor-destaque-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--cor-destaque)")
              }
            >
              <Filter size={16} />
              Filtrar
            </button>
            <button
              onClick={exportarCSV}
              style={{
                padding: "9px 18px",
                background: "transparent",
                color: "var(--cor-texto)",
                border: "1px solid var(--cor-borda)",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "var(--cor-destaque)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "var(--cor-borda)")
              }
            >
              <Download size={16} />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <div
            style={{ ...cardStyle, borderLeft: "4px solid var(--cor-perigo)" }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "var(--cor-texto-suave)",
                margin: "0 0 4px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Package size={14} /> Consumo
            </p>
            <p
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "var(--cor-perigo)",
                margin: 0,
              }}
            >
              {resumo.consumo}
            </p>
          </div>
          <div
            style={{ ...cardStyle, borderLeft: "4px solid var(--cor-alerta)" }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "var(--cor-texto-suave)",
                margin: "0 0 4px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <ArrowRightLeft size={14} /> Transferências
            </p>
            <p
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "var(--cor-alerta)",
                margin: 0,
              }}
            >
              {resumo.transferencia}
            </p>
          </div>
          <div
            style={{
              ...cardStyle,
              borderLeft: "4px solid var(--cor-destaque)",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "var(--cor-texto-suave)",
                margin: "0 0 4px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <TrendingUp size={14} /> Total Movimentado
            </p>
            <p
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "var(--cor-destaque)",
                margin: 0,
              }}
            >
              {resumo.total}
            </p>
          </div>
        </div>

        {movimentacoes.filter(
          (m) => m.tipo === "saida" && m.filial_destino === "",
        ).length > 0 && (
          <div
            style={{
              marginBottom: "32px",
              background: "var(--cor-superficie)",
              borderRadius: "12px",
              padding: "24px",
              border: "1px solid var(--cor-borda)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <h3
              style={{
                marginBottom: "16px",
                color: "var(--cor-texto-titulo)",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <BarChart3 size={18} />
              Top 10 Consumo por Insumo
            </h3>
            <div style={{ height: "320px" }}>
              {" "}
              {/* ← altura fixa e maior */}
              <Bar
                data={getDadosGrafico()}
                options={{
                  indexAxis: "y", // ← barras HORIZONTAIS!
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.parsed.x} unidades`,
                      },
                    },
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      ticks: { stepSize: 1 },
                      grid: { display: false },
                    },
                    y: {
                      grid: { display: false },
                      ticks: {
                        font: { size: 12 },
                      },
                    },
                  },
                  layout: {
                    padding: {
                      left: 0,
                      right: 10,
                    },
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* Tabela */}
        {loading && (
          <p style={{ color: "var(--cor-texto-suave)" }}>Carregando...</p>
        )}
        <div
          style={{
            overflowX: "auto",
            maxWidth: "100%",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <table style={{ minWidth: "800px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--cor-superficie-2)" }}>
                <th style={thStyle}>Data</th>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>Insumo</th>
                <th style={thStyle}>Origem</th>
                <th style={thStyle}>Destino</th>
                <th style={thStyle}>Qtd</th>
                <th style={thStyle}>NF</th>
                <th style={thStyle}>Responsável</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoes.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      color: "var(--cor-texto-suave)",
                    }}
                  >
                    <AlertCircle
                      size={16}
                      style={{ marginRight: "6px", verticalAlign: "middle" }}
                    />
                    Nenhuma movimentação encontrada
                  </td>
                </tr>
              )}
              {movimentacoes.map((m) => {
                const isConsumo = m.tipo === "saida" && m.filial_destino === "";
                return (
                  <tr
                    key={m.id}
                    style={{
                      background: isConsumo
                        ? "rgba(220, 38, 38, 0.05)"
                        : "transparent",
                    }}
                  >
                    <td style={tdStyle}>
                      {new Date(m.data).toLocaleString("pt-BR")}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        color:
                          m.tipo === "entrada"
                            ? "var(--cor-sucesso)"
                            : "var(--cor-perigo)",
                      }}
                    >
                      {m.tipo}
                      {isConsumo && (
                        <span
                          style={{
                            fontSize: "10px",
                            marginLeft: "4px",
                            background: "var(--cor-perigo)",
                            color: "#fff",
                            padding: "1px 6px",
                            borderRadius: "10px",
                          }}
                        >
                          consumo
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>{nomeInsumo(m.insumo_id)}</td>
                    <td style={tdStyle}>{nomeFilia(m.filial_origem)}</td>
                    <td style={tdStyle}>
                      {isConsumo ? "Consumo" : nomeFilia(m.filial_destino)}
                    </td>
                    <td style={tdStyle}>{m.quantidade}</td>
                    <td style={tdStyle}>{m.nota_fiscal || "—"}</td>
                    <td style={tdStyle}>{nomeResponsavel(m.responsavel_id)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
