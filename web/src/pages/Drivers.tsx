import { useEffect, useState, FormEvent } from "react";
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
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
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

  const inputClass = "px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900";

  if (loading) return <p className="text-gray-500">Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Motoristas</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex gap-3 flex-wrap items-center shadow-sm">
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
          placeholder="Buscar por nome ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">CPF</th>
              <th className="px-4 py-3 font-medium">CNH</th>
              <th className="px-4 py-3 font-medium">Veículo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredDrivers.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                <td className="px-4 py-3 text-gray-600">{d.document}</td>
                <td className="px-4 py-3 text-gray-600">{d.licenseNumber}</td>
                <td className="px-4 py-3 text-gray-600">{vehicleLabel(d.currentVehicleId)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[d.status]}`}>
                    {statusLabels[d.status] ?? d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => startEdit(d)} className="text-gray-600 hover:text-gray-900 font-medium">Editar</button>
                  <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:text-red-800 font-medium">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}