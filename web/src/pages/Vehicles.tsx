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
        plate,
        brand,
        model,
        year: Number(year),
        currentKm: Number(currentKm),
        status,
      });
    } else {
      await api.post("/vehicles", {
        plate,
        brand,
        model,
        year: Number(year),
        currentKm: 0,
      });
    }

    resetForm();
    loadVehicles();
  }

  async function handleDelete(id: number) {
    await api.delete(`/vehicles/${id}`);
    if (editingId === id) resetForm();
    loadVehicles();
  }

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h1>Veículos</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <input placeholder="Placa" value={plate} onChange={(e) => setPlate(e.target.value)} required />
        <input placeholder="Marca" value={brand} onChange={(e) => setBrand(e.target.value)} />
        <input placeholder="Modelo" value={model} onChange={(e) => setModel(e.target.value)} required />
        <input placeholder="Ano" type="number" value={year} onChange={(e) => setYear(e.target.value)} required />
        {editingId && (
          <>
            <input placeholder="KM" type="number" value={currentKm} onChange={(e) => setCurrentKm(e.target.value)} />
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="available">Disponível</option>
              <option value="rented">Alugado</option>
              <option value="maintenance">Manutenção</option>
            </select>
          </>
        )}
        <button type="submit">{editingId ? "Salvar" : "Adicionar"}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancelar</button>}
      </form>

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Placa</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Ano</th>
            <th>KM</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v.id}>
              <td>{v.plate}</td>
              <td>{v.brand}</td>
              <td>{v.model}</td>
              <td>{v.year}</td>
              <td>{v.currentKm}</td>
              <td>{v.status}</td>
              <td style={{ display: "flex", gap: 8 }}>
                <button onClick={() => startEdit(v)}>Editar</button>
                <button onClick={() => handleDelete(v.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}