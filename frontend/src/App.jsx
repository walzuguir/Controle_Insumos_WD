import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import EntradaInsumos from "./pages/EntradaInsumos";
import CadastroGestor from "./pages/CadastroGestor";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/entrada" element={<EntradaInsumos />} />
        <Route path="/gestor" element={<CadastroGestor />} />
      </Routes>
    </BrowserRouter>
  );
}
