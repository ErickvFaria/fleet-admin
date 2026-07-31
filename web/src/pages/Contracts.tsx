import { useEffect, useState, FormEvent } from "react";
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
  const inputClass = "px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900";

  if (loading) return <p className="text-gray-500">Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Contratos</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex gap-3 flex-wrap items-center shadow-sm">
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
        <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
          Criar contrato
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Motorista</th>
              <th className="px-4 py-3 font-medium">Veículo</th>
              <th className="px-4 py-3 font-medium">Início</th>
              <th className="px-4 py-3 font-medium">Fim</th>
              <th className="px-4 py-3 font-medium">Valor semanal</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contracts.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{driverName(c.driverId)}</td>
                <td className="px-4 py-3 text-gray-600">{vehiclePlate(c.vehicleId)}</td>
                <td className="px-4 py-3 text-gray-600">{c.startDate}</td>
                <td className="px-4 py-3 text-gray-600">{c.endDate ?? "-"}</td>
                <td className="px-4 py-3 text-gray-600">R$ {c.weeklyRate}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    c.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {c.status === "active" ? "Ativo" : "Encerrado"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {c.status === "active" && (
                    <button onClick={() => handleFinish(c.id)} className="text-gray-600 hover:text-gray-900 font-medium">Encerrar</button>
                  )}
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800 font-medium">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}