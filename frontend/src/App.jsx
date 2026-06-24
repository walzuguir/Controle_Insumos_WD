import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import EntradaInsumos from "./pages/EntradaInsumos";
import CadastroGestor from "./pages/CadastroGestor";
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/entrada" element={<PrivateRoute>
          <EntradaInsumos /></PrivateRoute>} />
        <Route path="/gestor" element={<PrivateRoute>
          <CadastroGestor /></PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
