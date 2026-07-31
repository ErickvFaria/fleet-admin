import { useEffect, useState, FormEvent } from "react";
import { api } from "../api/client";

interface Contract {
  id: number;
  driverId: number;
  vehicleId: number;
  startDate: string;
  endDate: string | null;
  weeklyRate: string;
  status: string;
}

interface Driver {
  id: number;
  name: string;
  currentVehicleId: number | null;
}

interface Vehicle {
  id: number;
  plate: string;
  status: string;
}

export function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [weeklyRate, setWeeklyRate] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const [contractsRes, driversRes, vehiclesRes] = await Promise.all([
      api.get("/contracts"),
      api.get("/drivers"),
      api.get("/vehicles"),
    ]);
    setContracts(contractsRes.data);
    setDrivers(driversRes.data);
    setVehicles(vehiclesRes.data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await api.post("/contracts", {
      driverId: Number(driverId),
      vehicleId: Number(vehicleId),
      startDate,
      weeklyRate,
    });
    setDriverId("");
    setVehicleId("");
    setStartDate("");
    setWeeklyRate("");
    loadData();
  }

  async function handleFinish(id: number) {
    const endDate = new Date().toISOString().slice(0, 10);
    await api.put(`/contracts/${id}/finish`, { endDate });
    loadData();
  }

  async function handleDelete(id: number) {
    await api.delete(`/contracts/${id}`);
    loadData();
  }

  function driverName(id: number) {
    return drivers.find((d) => d.id === id)?.name ?? "-";
  }

  function vehiclePlate(id: number) {
    return vehicles.find((v) => v.id === id)?.plate ?? "-";
  }

  // Só oferece veículos disponíveis pra novo contrato
  const availableVehicles = vehicles.filter((v) => v.status === "available");

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h1>Contratos</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <select value={driverId} onChange={(e) => setDriverId(e.target.value)} required>
          <option value="">Selecione o motorista</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required>
          <option value="">Selecione o veículo</option>
          {availableVehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.plate}</option>
          ))}
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        <input
          placeholder="Valor semanal"
          type="number"
          step="0.01"
          value={weeklyRate}
          onChange={(e) => setWeeklyRate(e.target.value)}
          required
        />
        <button type="submit">Criar contrato</button>
      </form>

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Motorista</th>
            <th>Veículo</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Valor semanal</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((c) => (
            <tr key={c.id}>
              <td>{driverName(c.driverId)}</td>
              <td>{vehiclePlate(c.vehicleId)}</td>
              <td>{c.startDate}</td>
              <td>{c.endDate ?? "-"}</td>
              <td>R$ {c.weeklyRate}</td>
              <td>{c.status === "active" ? "Ativo" : "Encerrado"}</td>
              <td style={{ display: "flex", gap: 8 }}>
                {c.status === "active" && (
                  <button onClick={() => handleFinish(c.id)}>Encerrar</button>
                )}
                <button onClick={() => handleDelete(c.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}