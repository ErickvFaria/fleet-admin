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
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0">
        <div className="px-5 py-5 border-b border-slate-200">
          <span className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm">FA</span>
            Fleet Admin
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-200 space-y-2">
          <div className="px-3 py-2 text-sm text-slate-500 truncate">{user?.name}</div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-60 px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}