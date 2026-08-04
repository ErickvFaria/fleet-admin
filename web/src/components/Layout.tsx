import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Car, Users, FileText, Wallet, Landmark, ClipboardCheck, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/vehicles", label: "Veículos", icon: Car },
  { to: "/drivers", label: "Motoristas", icon: Users },
  { to: "/contracts", label: "Contratos", icon: FileText },
  { to: "/financial", label: "Financeiro", icon: Wallet },
  { to: "/financings", label: "Financiamentos", icon: Landmark },
  { to: "/inspections", label: "Vistorias", icon: ClipboardCheck },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-1 sticky top-0 z-10">
        <span className="font-bold text-lg text-slate-900 mr-6 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm">FA</span>
          Fleet Admin
        </span>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <Icon size={16} />
              {item.label}
            </NavLink>
          );
        })}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-slate-500">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}