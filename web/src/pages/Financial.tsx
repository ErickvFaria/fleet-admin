import { useEffect, useState, FormEvent } from "react";
import { api } from "../api/client";

interface FinancialEntry {
  id: number;
  direction: string;
  category: string;
  description: string;
  amount: string;
  dueAt: string;
  paidAt: string | null;
  status: string;
  vehicleId: number | null;
  driverId: number | null;
}

interface Vehicle {
  id: number;
  plate: string;
}

interface Driver {
  id: number;
  name: string;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  overdue: "Atrasado",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

const categoryLabels: Record<string, string> = {
  aluguel: "Aluguel",
  manutencao: "Manutenção",
  combustivel: "Combustível",
  outro: "Outro",
};

export function Financial() {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [direction, setDirection] = useState("in");
  const [category, setCategory] = useState("aluguel");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [status, setStatus] = useState("pending");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function loadData() {
    const [entriesRes, vehiclesRes, driversRes] = await Promise.all([
      api.get("/financial-entries"),
      api.get("/vehicles"),
      api.get("/drivers"),
    ]);
    setEntries(entriesRes.data);
    setVehicles(vehiclesRes.data);
    setDrivers(driversRes.data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setDirection("in");
    setCategory("aluguel");
    setDescription("");
    setAmount("");
    setDueAt("");
    setPaidAt("");
    setStatus("pending");
    setVehicleId("");
    setDriverId("");
    setEditingId(null);
  }

  function startEdit(entry: FinancialEntry) {
    setEditingId(entry.id);
    setDirection(entry.direction);
    setCategory(entry.category);
    setDescription(entry.description);
    setAmount(entry.amount);
    setDueAt(entry.dueAt);
    setPaidAt(entry.paidAt ?? "");
    setStatus(entry.status);
    setVehicleId(entry.vehicleId ? String(entry.vehicleId) : "");
    setDriverId(entry.driverId ? String(entry.driverId) : "");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (editingId) {
      await api.put(`/financial-entries/${editingId}`, {
        direction, category, description, amount, dueAt, paidAt: paidAt || null, status,
      });
    } else {
      await api.post("/financial-entries", {
        direction, category, description, amount, dueAt,
        vehicleId: vehicleId ? Number(vehicleId) : null,
        driverId: driverId ? Number(driverId) : null,
      });
    }

    resetForm();
    loadData();
  }

  async function handleDelete(id: number) {
    await api.delete(`/financial-entries/${id}`);
    if (editingId === id) resetForm();
    loadData();
  }

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = entry.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? entry.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const inputClass = "px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900";

  if (loading) return <p className="text-gray-500">Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Financeiro</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex gap-3 flex-wrap items-center shadow-sm">
        <select className={inputClass} value={direction} onChange={(e) => setDirection(e.target.value)}>
          <option value="in">Entrada</option>
          <option value="out">Saída</option>
        </select>
        <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="aluguel">Aluguel</option>
          <option value="manutencao">Manutenção</option>
          <option value="combustivel">Combustível</option>
          <option value="outro">Outro</option>
        </select>
        <input className={inputClass} placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} required />
        <input className={inputClass + " w-28"} placeholder="Valor" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <input className={inputClass} type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} required />
        {!editingId && (
          <>
            <select className={inputClass} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">Sem veículo</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.plate}</option>
              ))}
            </select>
            <select className={inputClass} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">Sem motorista</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </>
        )}
        {editingId && (
          <>
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="overdue">Atrasado</option>
            </select>
            <input className={inputClass} type="date" placeholder="Data pagamento" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </>
        )}
        <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
          {editingId ? "Salvar" : "Adicionar"}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
            Cancelar
          </button>
        )}
      </form>

      <div className="flex gap-3 mb-4">
        <input
          className={inputClass + " flex-1"}
          placeholder="Buscar por descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="overdue">Atrasado</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className={entry.direction === "in" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {entry.direction === "in" ? "Entrada" : "Saída"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{categoryLabels[entry.category] ?? entry.category}</td>
                <td className="px-4 py-3 text-gray-600">{entry.description}</td>
                <td className="px-4 py-3 text-gray-900 font-medium">R$ {entry.amount}</td>
                <td className="px-4 py-3 text-gray-600">{entry.dueAt}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[entry.status]}`}>
                    {statusLabels[entry.status] ?? entry.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => startEdit(entry)} className="text-gray-600 hover:text-gray-900 font-medium">Editar</button>
                  <button onClick={() => handleDelete(entry.id)} className="text-red-600 hover:text-red-800 font-medium">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}