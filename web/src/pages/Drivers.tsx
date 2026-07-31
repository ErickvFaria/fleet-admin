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
  const [loading, setLoading] = useState(true);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await api.post("/drivers", {
      name,
      document,
      licenseNumber,
      currentVehicleId: currentVehicleId ? Number(currentVehicleId) : null,
    });
    setName("");
    setDocument("");
    setLicenseNumber("");
    setCurrentVehicleId("");
    loadData();
  }

  async function handleDelete(id: number) {
    await api.delete(`/drivers/${id}`);
    loadData();
  }

  function vehicleLabel(id: number | null) {
    if (!id) return "-";
    const v = vehicles.find((v) => v.id === id);
    return v ? `${v.plate} (${v.model})` : "-";
  }

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h1>Motoristas</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
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
        <button type="submit">Adicionar</button>
      </form>

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
          {drivers.map((d) => (
            <tr key={d.id}>
              <td>{d.name}</td>
              <td>{d.document}</td>
              <td>{d.licenseNumber}</td>
              <td>{vehicleLabel(d.currentVehicleId)}</td>
              <td>{d.status}</td>
              <td>
                <button onClick={() => handleDelete(d.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}