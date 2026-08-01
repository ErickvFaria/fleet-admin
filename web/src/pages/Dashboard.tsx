import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Car, Users, Wallet, TrendingUp, TrendingDown, Landmark } from "lucide-react";
import { api } from "../api/client";

interface Vehicle {
  id: number;
  status: string;
}

interface Driver {
  id: number;
  status: string;
}

interface FinancialEntry {
  id: number;
  direction: string;
  amount: string;
  status: string;
  dueAt: string;
}

interface Financing {
  installmentValue: string;
  totalInstallments: number;
  paidInstallments: number;
}

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [financings, setFinancings] = useState<Financing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [vehiclesRes, driversRes, entriesRes, financingsRes] = await Promise.all([
        api.get("/vehicles"),
        api.get("/drivers"),
        api.get("/financial-entries"),
        api.get("/financings"),
      ]);
      setVehicles(vehiclesRes.data);
      setDrivers(driversRes.data);
      setEntries(entriesRes.data);
      setFinancings(financingsRes.data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-slate-500">Carregando...</p>;

  const availableVehicles = vehicles.filter((v) => v.status === "available").length;
  const rentedVehicles = vehicles.filter((v) => v.status === "rented").length;
  const occupancyRate = vehicles.length > 0 ? Math.round((rentedVehicles / vehicles.length) * 100) : 0;
  const activeDrivers = drivers.filter((d) => d.status === "active").length;

  const totalIn = entries
    .filter((e) => e.direction === "in" && e.status !== "pending")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalOut = entries
    .filter((e) => e.direction === "out" && e.status !== "pending")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalPending = entries
    .filter((e) => e.status === "pending")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const cashBalance = totalIn - totalOut;

  const totalFinancingRemaining = financings.reduce(
    (sum, f) => sum + Number(f.installmentValue) * (f.totalInstallments - f.paidInstallments),
    0
  );

  const monthlyMap = new Map<string, { in: number; out: number }>();
  for (const entry of entries) {
    const date = new Date(entry.dueAt);
    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
    if (!monthlyMap.has(key)) monthlyMap.set(key, { in: 0, out: 0 });
    const bucket = monthlyMap.get(key)!;
    if (entry.direction === "in") bucket.in += Number(entry.amount);
    else bucket.out += Number(entry.amount);
  }

  const monthlyData = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => {
      const [, month] = key.split("-");
      return {
        month: monthNames[Number(month)],
        Entradas: values.in,
        Saídas: values.out,
      };
    });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm shadow-slate-200/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Veículos</p>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Car size={18} className="text-indigo-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-2">{vehicles.length}</p>
          <div className="flex gap-3 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">{availableVehicles} livres</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{rentedVehicles} alugados</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm shadow-slate-200/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Ocupação da frota</p>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
              <TrendingUp size={18} className="text-indigo-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-2">{occupancyRate}%</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div className="bg-indigo-600 h-1.5 rounded-full transition-all" style={{ width: `${occupancyRate}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm shadow-slate-200/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Motoristas</p>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Users size={18} className="text-indigo-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-2">{drivers.length}</p>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium text-xs">{activeDrivers} ativos</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm shadow-slate-200/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Financiamento</p>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Landmark size={18} className="text-indigo-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">R$ {totalFinancingRemaining.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">restante a pagar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-5 shadow-lg shadow-indigo-200 text-white lg:col-span-1">
          <p className="text-sm font-medium text-indigo-100 mb-1">Saldo em caixa</p>
          <p className="text-3xl font-bold mb-4">R$ {cashBalance.toFixed(2)}</p>
          <div className="space-y-2 text-sm border-t border-indigo-500 pt-3">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-indigo-100"><TrendingUp size={14} /> Recebido</span>
              <span className="font-medium">R$ {totalIn.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-indigo-100"><TrendingDown size={14} /> Pago</span>
              <span className="font-medium">R$ {totalOut.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-indigo-100"><Wallet size={14} /> Pendente</span>
              <span className="font-medium">R$ {totalPending.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm shadow-slate-200/50 lg:col-span-2">
          <p className="text-sm font-medium text-slate-500 mb-4">Entradas x Saídas por mês</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              />
              <Legend />
              <Bar dataKey="Entradas" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Saídas" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}