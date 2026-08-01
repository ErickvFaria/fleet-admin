import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
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

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [vehiclesRes, driversRes, entriesRes] = await Promise.all([
        api.get("/vehicles"),
        api.get("/drivers"),
        api.get("/financial-entries"),
      ]);
      setVehicles(vehiclesRes.data);
      setDrivers(driversRes.data);
      setEntries(entriesRes.data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-gray-500">Carregando...</p>;

  const availableVehicles = vehicles.filter((v) => v.status === "available").length;
  const rentedVehicles = vehicles.filter((v) => v.status === "rented").length;
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-3">Veículos</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{vehicles.length}</p>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600">{availableVehicles} disponíveis</span>
            <span className="text-blue-600">{rentedVehicles} alugados</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-3">Motoristas</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{drivers.length}</p>
          <div className="text-sm text-green-600">{activeDrivers} ativos</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Saldo em caixa</p>
          <p className={`text-3xl font-bold mb-3 ${cashBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
            R$ {cashBalance.toFixed(2)}
          </p>
          <div className="space-y-1 text-sm border-t border-gray-100 pt-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Recebido</span>
              <span className="font-medium text-green-600">R$ {totalIn.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pago</span>
              <span className="font-medium text-red-600">R$ {totalOut.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pendente</span>
              <span className="font-medium text-yellow-600">R$ {totalPending.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-500 mb-4">Entradas x Saídas por mês</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip
              formatter={(value: number) => `R$ ${value.toFixed(2)}`}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <Legend />
            <Bar dataKey="Entradas" fill="#16a34a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Saídas" fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}