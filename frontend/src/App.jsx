import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import EntradaInsumos from "./pages/EntradaInsumos";
import CadastroGestor from "./pages/CadastroGestor";
import SaidaInsumos from './pages/SaidaInsumos';
import Relatorio from './pages/Relatorio';
import Dashboard from './pages/Dashboard';
import PainelGaps from './pages/PainelGaps';
import Home from './pages/Home';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/entrada" element={<PrivateRoute>
          <EntradaInsumos /></PrivateRoute>} />
        <Route path="/gestor" element={<PrivateRoute>
          <CadastroGestor /></PrivateRoute>} />
        <Route path="/saida" element={<PrivateRoute>
          <SaidaInsumos /></PrivateRoute>} />
        <Route path="/relatorio" element={<PrivateRoute>
          <Relatorio /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute>
          <Dashboard /></PrivateRoute>} />
        <Route path="/gaps" element={<PrivateRoute>
          <PainelGaps /></PrivateRoute>} />
        <Route path="/home" element={<PrivateRoute>
          <Home /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
