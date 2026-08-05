import { useEffect, useState, FormEvent } from "react";
import { Plus, Pencil, Trash2, CheckCircle2, X } from "lucide-react";
import { api } from "../api/client";

interface Contract {
  id: number;
  driverId: number;
  vehicleId: number;
  startDate: string;
  endDate: string | null;
  termEndDate: string | null;
  paymentDayOfWeek: number;
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

const weekDays = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
];

export function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [termEndDate, setTermEndDate] = useState("");
  const [paymentDayOfWeek, setPaymentDayOfWeek] = useState("1");
  const [weeklyRate, setWeeklyRate] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
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

  function resetForm() {
    setDriverId("");
    setVehicleId("");
    setStartDate("");
    setTermEndDate("");
    setPaymentDayOfWeek("1");
    setWeeklyRate("");
    setEditingId(null);
  }

  function startEdit(contract: Contract) {
    setEditingId(contract.id);
    setDriverId(String(contract.driverId));
    setVehicleId(String(contract.vehicleId));
    setStartDate(contract.startDate);
    setTermEndDate(contract.termEndDate ?? "");
    setPaymentDayOfWeek(String(contract.paymentDayOfWeek));
    setWeeklyRate(contract.weeklyRate);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (editingId) {
      await api.put(`/contracts/${editingId}`, {
        startDate,
        termEndDate: termEndDate || null,
        paymentDayOfWeek: Number(paymentDayOfWeek),
        weeklyRate,
      });
    } else {
      await api.post("/contracts", {
        driverId: Number(driverId),
        vehicleId: Number(vehicleId),
        startDate,
        termEndDate: termEndDate || null,
        paymentDayOfWeek: Number(paymentDayOfWeek),
        weeklyRate,
      });
    }

    resetForm();
    loadData();
  }

  async function handleFinish(id: number) {
    const endDate = new Date().toISOString().slice(0, 10);
    await api.put(`/contracts/${id}/finish`, { endDate });
    loadData();
  }

  async function handleDelete(id: number) {
    await api.delete(`/contracts/${id}`);
    if (editingId === id) resetForm();
    loadData();
  }

  function driverName(id: number) {
    return drivers.find((d) => d.id === id)?.name ?? "-";
  }

  function vehiclePlate(id: number) {
    return vehicles.find((v) => v.id === id)?.plate ?? "-";
  }

  function weekDayLabel(value: number) {
    return weekDays.find((d) => d.value === value)?.label ?? "-";
  }

  const availableVehicles = vehicles.filter((v) => v.status === "available");
  const inputClass = "px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  if (loading) return <p className="text-slate-500">Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Contratos</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex gap-3 flex-wrap items-end shadow-sm shadow-slate-200/50">
        {!editingId && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Motorista</label>
              <select className={inputClass} value={driverId} onChange={(e) => setDriverId(e.target.value)} required>
                <option value="">Selecione</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Veículo</label>
              <select className={inputClass} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required>
                <option value="">Selecione</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.plate}</option>
                ))}
              </select>
            </div>
          </>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Início</label>
          <input className={inputClass} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Término previsto</label>
          <input className={inputClass} type="date" value={termEndDate} onChange={(e) => setTermEndDate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Dia de pagamento</label>
          <select className={inputClass} value={paymentDayOfWeek} onChange={(e) => setPaymentDayOfWeek(e.target.value)} required>
            {weekDays.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Valor semanal</label>
          <input
            className={inputClass + " w-32"}
            type="number"
            step="0.01"
            value={weeklyRate}
            onChange={(e) => setWeeklyRate(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
          {editingId ? <Pencil size={16} /> : <Plus size={16} />}
          {editingId ? "Salvar" : "Criar contrato"}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={16} />
            Cancelar
          </button>
        )}
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm shadow-slate-200/50">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Motorista</th>
              <th className="px-4 py-3 font-medium">Veículo</th>
              <th className="px-4 py-3 font-medium">Início</th>
              <th className="px-4 py-3 font-medium">Término previsto</th>
              <th className="px-4 py-3 font-medium">Pagamento</th>
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
                <td className="px-4 py-3 text-slate-600">{c.termEndDate ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">{weekDayLabel(c.paymentDayOfWeek)}</td>
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
                      <>
                        <button onClick={() => startEdit(c)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Editar">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleFinish(c.id)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Encerrar">
                          <CheckCircle2 size={16} />
                        </button>
                      </>
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