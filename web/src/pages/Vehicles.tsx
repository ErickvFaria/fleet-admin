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
  const [loading, setLoading] = useState(true);

  async function loadVehicles() {
    const response = await api.get("/vehicles");
    setVehicles(response.data);
    setLoading(false);
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await api.post("/vehicles", {
      plate,
      brand,
      model,
      year: Number(year),
      currentKm: 0,
    });
    setPlate("");
    setBrand("");
    setModel("");
    setYear("");
    loadVehicles();
  }

  async function handleDelete(id: number) {
    await api.delete(`/vehicles/${id}`);
    loadVehicles();
  }

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h1>Veículos</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input placeholder="Placa" value={plate} onChange={(e) => setPlate(e.target.value)} required />
        <input placeholder="Marca" value={brand} onChange={(e) => setBrand(e.target.value)} />
        <input placeholder="Modelo" value={model} onChange={(e) => setModel(e.target.value)} required />
        <input placeholder="Ano" type="number" value={year} onChange={(e) => setYear(e.target.value)} required />
        <button type="submit">Adicionar</button>
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
              <td>
                <button onClick={() => handleDelete(v.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}