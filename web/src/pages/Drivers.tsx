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

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h1>Motoristas</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder="CPF" value={document} onChange={(e) => setDocument(e.target.value)} required />
        <input placeholder="CNH" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
        <select value={currentVehicleId} onChange={(e) => setCurrentVehicleId(e.target.value)}>
          <option value="">Sem veículo</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plate} ({v.model})
            </option>
          ))}
        </select>
        {editingId && (
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        )}
        <button type="submit">{editingId ? "Salvar" : "Adicionar"}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancelar</button>}
      </form>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Buscar por nome ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF</th>
            <th>CNH</th>
            <th>Veículo</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredDrivers.map((d) => (
            <tr key={d.id}>
              <td>{d.name}</td>
              <td>{d.document}</td>
              <td>{d.licenseNumber}</td>
              <td>{vehicleLabel(d.currentVehicleId)}</td>
              <td>{d.status}</td>
              <td style={{ display: "flex", gap: 8 }}>
                <button onClick={() => startEdit(d)}>Editar</button>
                <button onClick={() => handleDelete(d.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}