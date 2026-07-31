import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Vehicle {
  id: number;
  status: string;
}

interface Driver {
  id: number;
  status: string;
}

interface FinancialEntry {
  id: number;
  direction: string;
  amount: string;
  status: string;
}

export function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [vehiclesRes, driversRes, entriesRes] = await Promise.all([
        api.get("/vehicles"),
        api.get("/drivers"),
        api.get("/financial-entries"),
      ]);
      setVehicles(vehiclesRes.data);
      setDrivers(driversRes.data);
      setEntries(entriesRes.data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p>Carregando...</p>;

  const availableVehicles = vehicles.filter((v) => v.status === "available").length;
  const rentedVehicles = vehicles.filter((v) => v.status === "rented").length;
  const activeDrivers = drivers.filter((d) => d.status === "active").length;

  const totalIn = entries
    .filter((e) => e.direction === "in" && e.status !== "pending")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalOut = entries
    .filter((e) => e.direction === "out" && e.status !== "pending")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalPending = entries
    .filter((e) => e.status === "pending")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const cardStyle: React.CSSProperties = {
    border: "1px solid #ccc",
    borderRadius: 8,
    padding: 16,
    minWidth: 180,
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={cardStyle}>
          <strong>Veículos</strong>
          <p>Total: {vehicles.length}</p>
          <p>Disponíveis: {availableVehicles}</p>
          <p>Alugados: {rentedVehicles}</p>
        </div>
        <div style={cardStyle}>
          <strong>Motoristas</strong>
          <p>Total: {drivers.length}</p>
          <p>Ativos: {activeDrivers}</p>
        </div>
        <div style={cardStyle}>
          <strong>Financeiro</strong>
          <p>Recebido: R$ {totalIn.toFixed(2)}</p>
          <p>Pago: R$ {totalOut.toFixed(2)}</p>
          <p>Pendente: R$ {totalPending.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}