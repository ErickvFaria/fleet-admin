import { useEffect, useState, FormEvent } from "react";
import { api } from "../api/client";

interface Vehicle {
  id: number;
  plate: string;
  brand: string | null;
  model: string;
  year: number;
  currentKm: number;
  status: string;
}

const statusLabels: Record<string, string> = {
  available: "Disponível",
  rented: "Alugado",
  maintenance: "Manutenção",
};

const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  rented: "bg-blue-100 text-blue-700",
  maintenance: "bg-yellow-100 text-yellow-700",
};

export function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [currentKm, setCurrentKm] = useState("");
  const [status, setStatus] = useState("available");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function loadVehicles() {
    const response = await api.get("/vehicles");
    setVehicles(response.data);
    setLoading(false);
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  function resetForm() {
    setPlate("");
    setBrand("");
    setModel("");
    setYear("");
    setCurrentKm("");
    setStatus("available");
    setEditingId(null);
  }

  function startEdit(vehicle: Vehicle) {
    setEditingId(vehicle.id);
    setPlate(vehicle.plate);
    setBrand(vehicle.brand ?? "");
    setModel(vehicle.model);
    setYear(String(vehicle.year));
    setCurrentKm(String(vehicle.currentKm));
    setStatus(vehicle.status);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (editingId) {
      await api.put(`/vehicles/${editingId}`, {
        plate, brand, model, year: Number(year), currentKm: Number(currentKm), status,
      });
    } else {
      await api.post("/vehicles", { plate, brand, model, year: Number(year), currentKm: 0 });
    }

    resetForm();
    loadVehicles();
  }

  async function handleDelete(id: number) {
    await api.delete(`/vehicles/${id}`);
    if (editingId === id) resetForm();
    loadVehicles();
  }

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.plate.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? v.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const inputClass = "px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900";

  if (loading) return <p className="text-gray-500">Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Veículos</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex gap-3 flex-wrap items-center shadow-sm">
        <input className={inputClass} placeholder="Placa" value={plate} onChange={(e) => setPlate(e.target.value)} required />
        <input className={inputClass} placeholder="Marca" value={brand} onChange={(e) => setBrand(e.target.value)} />
        <input className={inputClass} placeholder="Modelo" value={model} onChange={(e) => setModel(e.target.value)} required />
        <input className={inputClass + " w-24"} placeholder="Ano" type="number" value={year} onChange={(e) => setYear(e.target.value)} required />
        {editingId && (
          <>
            <input className={inputClass + " w-28"} placeholder="KM" type="number" value={currentKm} onChange={(e) => setCurrentKm(e.target.value)} />
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="available">Disponível</option>
              <option value="rented">Alugado</option>
              <option value="maintenance">Manutenção</option>
            </select>
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
          placeholder="Buscar por placa ou modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="available">Disponível</option>
          <option value="rented">Alugado</option>
          <option value="maintenance">Manutenção</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Placa</th>
              <th className="px-4 py-3 font-medium">Marca</th>
              <th className="px-4 py-3 font-medium">Modelo</th>
              <th className="px-4 py-3 font-medium">Ano</th>
              <th className="px-4 py-3 font-medium">KM</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredVehicles.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{v.plate}</td>
                <td className="px-4 py-3 text-gray-600">{v.brand}</td>
                <td className="px-4 py-3 text-gray-600">{v.model}</td>
                <td className="px-4 py-3 text-gray-600">{v.year}</td>
                <td className="px-4 py-3 text-gray-600">{v.currentKm.toLocaleString("pt-BR")}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[v.status]}`}>
                    {statusLabels[v.status] ?? v.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => startEdit(v)} className="text-gray-600 hover:text-gray-900 font-medium">Editar</button>
                  <button onClick={() => handleDelete(v.id)} className="text-red-600 hover:text-red-800 font-medium">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}