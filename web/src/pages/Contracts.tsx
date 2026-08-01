import { useEffect, useState, FormEvent } from "react";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { api } from "../api/client";

interface Contract {
  id: number;
  driverId: number;
  vehicleId: number;
  startDate: string;
  endDate: string | null;
  weeklyRate: string;
  status: string;
}

interface Driver {
  id: number;
  name: string;
  currentVehicleId: number | null;
}

interface Vehicle {
  id: number;
  plate: string;
  status: string;
}

export function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [weeklyRate, setWeeklyRate] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const [contractsRes, driversRes, vehiclesRes] = await Promise.all([
      api.get("/contracts"),
      api.get("/drivers"),
      api.get("/vehicles"),
    ]);
    setContracts(contractsRes.data);
    setDrivers(driversRes.data);
    setVehicles(vehiclesRes.data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await api.post("/contracts", {
      driverId: Number(driverId),
      vehicleId: Number(vehicleId),
      startDate,
      weeklyRate,
    });
    setDriverId("");
    setVehicleId("");
    setStartDate("");
    setWeeklyRate("");
    loadData();
  }

  async function handleFinish(id: number) {
    const endDate = new Date().toISOString().slice(0, 10);
    await api.put(`/contracts/${id}/finish`, { endDate });
    loadData();
  }

  async function handleDelete(id: number) {
    await api.delete(`/contracts/${id}`);
    loadData();
  }

  function driverName(id: number) {
    return drivers.find((d) => d.id === id)?.name ?? "-";
  }

  function vehiclePlate(id: number) {
    return vehicles.find((v) => v.id === id)?.plate ?? "-";
  }

  const availableVehicles = vehicles.filter((v) => v.status === "available");
  const inputClass = "px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  if (loading) return <p className="text-slate-500">Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Contratos</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex gap-3 flex-wrap items-center shadow-sm shadow-slate-200/50">
        <select className={inputClass} value={driverId} onChange={(e) => setDriverId(e.target.value)} required>
          <option value="">Selecione o motorista</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select className={inputClass} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required>
          <option value="">Selecione o veículo</option>
          {availableVehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.plate}</option>
          ))}
        </select>
        <input className={inputClass} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        <input
          className={inputClass + " w-32"}
          placeholder="Valor semanal"
          type="number"
          step="0.01"
          value={weeklyRate}
          onChange={(e) => setWeeklyRate(e.target.value)}
          required
        />
        <button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
          <Plus size={16} />
          Criar contrato
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm shadow-slate-200/50">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Motorista</th>
              <th className="px-4 py-3 font-medium">Veículo</th>
              <th className="px-4 py-3 font-medium">Início</th>
              <th className="px-4 py-3 font-medium">Fim</th>
              <th className="px-4 py-3 font-medium">Valor semanal</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contracts.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">{driverName(c.driverId)}</td>
                <td className="px-4 py-3 text-slate-600">{vehiclePlate(c.vehicleId)}</td>
                <td className="px-4 py-3 text-slate-600">{c.startDate}</td>
                <td className="px-4 py-3 text-slate-600">{c.endDate ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">R$ {c.weeklyRate}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    c.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {c.status === "active" ? "Ativo" : "Encerrado"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    {c.status === "active" && (
                      <button onClick={() => handleFinish(c.id)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Encerrar">
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-red-600 transition-colors" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}