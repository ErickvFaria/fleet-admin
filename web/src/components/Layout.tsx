import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div>
      <nav style={{ display: "flex", gap: 16, padding: 16, borderBottom: "1px solid #ccc", alignItems: "center" }}>
        <Link to="/">Dashboard</Link>
        <Link to="/vehicles">Veículos</Link>
        <Link to="/drivers">Motoristas</Link>
        <Link to="/financial">Financeiro</Link>
        <Link to="/contracts">Contratos</Link>
        <span style={{ marginLeft: "auto" }}>{user?.name}</span>
        <button onClick={handleLogout}>Sair</button>
      </nav>
      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}