import { useEffect, useState, FormEvent } from "react";
import { api } from "../api/client";

interface FinancialEntry {
  id: number;
  direction: string;
  category: string;
  description: string;
  amount: string;
  dueAt: string;
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

export function Financial() {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [direction, setDirection] = useState("in");
  const [category, setCategory] = useState("aluguel");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [loading, setLoading] = useState(true);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await api.post("/financial-entries", {
      direction,
      category,
      description,
      amount,
      dueAt,
      vehicleId: vehicleId ? Number(vehicleId) : null,
      driverId: driverId ? Number(driverId) : null,
    });
    setDescription("");
    setAmount("");
    setDueAt("");
    setVehicleId("");
    setDriverId("");
    loadData();
  }

  async function handleDelete(id: number) {
    await api.delete(`/financial-entries/${id}`);
    loadData();
  }

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h1>Financeiro</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <select value={direction} onChange={(e) => setDirection(e.target.value)}>
          <option value="in">Entrada</option>
          <option value="out">Saída</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="aluguel">Aluguel</option>
          <option value="manutencao">Manutenção</option>
          <option value="combustivel">Combustível</option>
          <option value="outro">Outro</option>
        </select>
        <input placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} required />
        <input placeholder="Valor" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} required />
        <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
          <option value="">Sem veículo</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.plate}</option>
          ))}
        </select>
        <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
          <option value="">Sem motorista</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <button type="submit">Adicionar</button>
      </form>

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Categoria</th>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.direction === "in" ? "Entrada" : "Saída"}</td>
              <td>{entry.category}</td>
              <td>{entry.description}</td>
              <td>R$ {entry.amount}</td>
              <td>{entry.dueAt}</td>
              <td>{entry.status}</td>
              <td>
                <button onClick={() => handleDelete(entry.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}