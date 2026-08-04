  export const classificarMovimento = (m) => {
    if (m.tipo === "entrada") return "entrada";
    if (m.tipo === "saida" && m.filial_destino === "") return "consumo";
    return "transferencia"; return "saida";
  };