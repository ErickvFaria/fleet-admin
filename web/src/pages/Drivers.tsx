import { useEffect, useState, FormEvent } from "react";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { api } from "../api/client";

interface Driver {
  id: number;
  name: string;
  document: string;
  licenseNumber: string | null;
  currentVehicleId: number | null;
  status: string;
}

interface Vehicle {
  id: number;
  plate: string;
  model: string;
}

const statusLabels: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
};

export function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [currentVehicleId, setCurrentVehicleId] = useState("");
  const [status, setStatus] = useState("active");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function loadData() {
    const [driversRes, vehiclesRes] = await Promise.all([
      api.get("/drivers"),
      api.get("/vehicles"),
    ]);
    setDrivers(driversRes.data);
    setVehicles(vehiclesRes.data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setName("");
    setDocument("");
    setLicenseNumber("");
    setCurrentVehicleId("");
    setStatus("active");
    setEditingId(null);
  }

  function startEdit(driver: Driver) {
    setEditingId(driver.id);
    setName(driver.name);
    setDocument(driver.document);
    setLicenseNumber(driver.licenseNumber ?? "");
    setCurrentVehicleId(driver.currentVehicleId ? String(driver.currentVehicleId) : "");
    setStatus(driver.status);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = {
      name,
      document,
      licenseNumber,
      currentVehicleId: currentVehicleId ? Number(currentVehicleId) : null,
    };

    if (editingId) {
      await api.put(`/drivers/${editingId}`, { ...payload, status });
    } else {
      await api.post("/drivers", payload);
    }

    resetForm();
    loadData();
  }

  async function handleDelete(id: number) {
    await api.delete(`/drivers/${id}`);
    if (editingId === id) resetForm();
    loadData();
  }

  function vehicleLabel(id: number | null) {
    if (!id) return "-";
    const v = vehicles.find((v) => v.id === id);
    return v ? `${v.plate} (${v.model})` : "-";
  }

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.document.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? d.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const inputClass = "px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  if (loading) return <p className="text-slate-500">Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Motoristas</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex gap-3 flex-wrap items-center shadow-sm shadow-slate-200/50">
        <input className={inputClass} placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={inputClass} placeholder="CPF" value={document} onChange={(e) => setDocument(e.target.value)} required />
        <input className={inputClass} placeholder="CNH" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
        <select className={inputClass} value={currentVehicleId} onChange={(e) => setCurrentVehicleId(e.target.value)}>
          <option value="">Sem veículo</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.plate} ({v.model})</option>
          ))}
        </select>
        {editingId && (
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        )}
        <button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
          {editingId ? <Pencil size={16} /> : <Plus size={16} />}
          {editingId ? "Salvar" : "Adicionar"}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={16} />
            Cancelar
          </button>
        )}
      </form>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={inputClass + " w-full pl-9"}
            placeholder="Buscar por nome ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm shadow-slate-200/50">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">CPF</th>
              <th className="px-4 py-3 font-medium">CNH</th>
              <th className="px-4 py-3 font-medium">Veículo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDrivers.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">{d.name}</td>
                <td className="px-4 py-3 text-slate-600">{d.document}</td>
                <td className="px-4 py-3 text-slate-600">{d.licenseNumber}</td>
                <td className="px-4 py-3 text-slate-600">{vehicleLabel(d.currentVehicleId)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[d.status]}`}>
                    {statusLabels[d.status] ?? d.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => startEdit(d)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Editar">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(d.id)} className="text-slate-400 hover:text-red-600 transition-colors" title="Excluir">
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