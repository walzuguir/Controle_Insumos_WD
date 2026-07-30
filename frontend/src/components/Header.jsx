import { useNavigate, NavLink } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Settings,
  GitBranch,
} from "lucide-react";
import logo from "../assets/widmen-logo-1.png";

export default function Header() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const ehGestor = usuario?.filial_id === "gestor";
  const filialDoUsuario = usuario?.filial_id || "";

  const filialPadrao = ehGestor ? "1" : filialDoUsuario;
  const dashboardUrl = filialPadrao
    ? `/dashboard?filial=${filialPadrao}`
    : "/dashboard";

  const menuLinks = [
    { nome: "Início", rota: "/home", icone: Home },
    { nome: "Dashboard", rota: dashboardUrl, icone: LayoutDashboard },
    ...(ehGestor
      ? [{ nome: "Entrada", rota: "/entrada", icone: ArrowUpCircle }] //
      : []),
    { nome: "Saída", rota: "/saida", icone: ArrowDownCircle },
    { nome: "Relatório", rota: "/relatorio", icone: BarChart3 },
  ];

  if (ehGestor) {
    menuLinks.push(
      { nome: "GAPs", rota: "/gaps", icone: GitBranch },
      { nome: "Gestor", rota: "/gestor", icone: Settings },
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/");
  };

  return (
    <>
      <div
        style={{
          borderBottom: "1px solid var(--cor-borda)",
          background: "var(--cor-header)",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "12px 16px 12px 4px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
              marginRight: "auto",
            }}
          >
            <img
              src={logo}
              alt=""
              draggable={false}
              style={{
                height: "30px",
                width: "auto",
                filter: "blur(0.5px)",
                userSelect: "none",
                pointerEvents: "none",
                marginLeft: "15px",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontSize: "12px",
                color: "var(--cor-texto-suave)",
                whiteSpace: "nowrap",
              }}
            >
              {usuario?.filial_id === "gestor"
                ? "Gestor"
                : `Filial ${usuario?.filial_id}`}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: "6px 12px",
                background: "transparent",
                border: "1px solid var(--cor-borda)",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                color: "var(--cor-perigo)",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "var(--cor-superficie)",
          borderBottom: "1px solid var(--cor-borda)",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "8px 16px",
            display: "flex",
            gap: "4px",
            overflowX: "auto",
            whiteSpace: "nowrap",
          }}
        >
          {menuLinks.map((link) => {
            const Icon = link.icone;
            return (
              <NavLink
                key={link.rota}
                to={link.rota}
                style={({ isActive }) => ({
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  textDecoration: "none",
                  fontWeight: isActive ? "600" : "400",
                  color: isActive
                    ? "var(--cor-destaque)"
                    : "var(--cor-texto-suave)",
                  background: isActive
                    ? "rgba(30, 155, 215, 0.12)"
                    : "transparent",
                  flexShrink: 0,
                  transition: "color 0.2s, background 0.2s",
                })}
              >
                <Icon
                  size={16}
                  style={{ marginRight: "4px", verticalAlign: "middle" }}
                />
                {link.nome}
              </NavLink>
            );
          })}
        </div>
      </div>
    </>
  );
}
