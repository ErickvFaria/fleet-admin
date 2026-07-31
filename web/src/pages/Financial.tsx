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
        direction,
        category,
        description,
        amount,
        dueAt,
        paidAt: paidAt || null,
        status,
      });
    } else {
      await api.post("/financial-entries", {
        direction,
        category,
        description,
        amount,
        dueAt,
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
        {!editingId && (
          <>
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
          </>
        )}
        {editingId && (
          <>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="overdue">Atrasado</option>
            </select>
            <input type="date" placeholder="Data pagamento" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </>
        )}
        <button type="submit">{editingId ? "Salvar" : "Adicionar"}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancelar</button>}
      </form>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Buscar por descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="overdue">Atrasado</option>
        </select>
      </div>

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
          {filteredEntries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.direction === "in" ? "Entrada" : "Saída"}</td>
              <td>{entry.category}</td>
              <td>{entry.description}</td>
              <td>R$ {entry.amount}</td>
              <td>{entry.dueAt}</td>
              <td>{entry.status}</td>
              <td style={{ display: "flex", gap: 8 }}>
                <button onClick={() => startEdit(entry)}>Editar</button>
                <button onClick={() => handleDelete(entry.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}