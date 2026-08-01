import { useEffect, useState, FormEvent } from "react";
import { api } from "../api/client";

interface Financing {
  id: number;
  vehicleId: number;
  installmentValue: string;
  dueDay: number;
  totalInstallments: number;
  paidInstallments: number;
  status: string;
}

interface Insurance {
  id: number;
  vehicleId: number;
  monthlyValue: string;
  dueDay: number;
  lastPaidAt: string | null;
  status: string;
}

interface Vehicle {
  id: number;
  plate: string;
}

export function Financings() {
  const [financings, setFinancings] = useState<Financing[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const [finVehicleId, setFinVehicleId] = useState("");
  const [finValue, setFinValue] = useState("");
  const [finDueDay, setFinDueDay] = useState("");
  const [finTotal, setFinTotal] = useState("");

  const [insVehicleId, setInsVehicleId] = useState("");
  const [insValue, setInsValue] = useState("");
  const [insDueDay, setInsDueDay] = useState("");

  const [paymentAmounts, setPaymentAmounts] = useState<Record<number, string>>({});

  async function loadData() {
    const [finRes, insRes, vehRes] = await Promise.all([
      api.get("/financings"),
      api.get("/insurances"),
      api.get("/vehicles"),
    ]);
    setFinancings(finRes.data);
    setInsurances(insRes.data);
    setVehicles(vehRes.data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function vehiclePlate(id: number) {
    return vehicles.find((v) => v.id === id)?.plate ?? "-";
  }

  async function handleCreateFinancing(e: FormEvent) {
    e.preventDefault();
    await api.post("/financings", {
      vehicleId: Number(finVehicleId),
      installmentValue: finValue,
      dueDay: Number(finDueDay),
      totalInstallments: Number(finTotal),
    });
    setFinVehicleId("");
    setFinValue("");
    setFinDueDay("");
    setFinTotal("");
    loadData();
  }

  function getPaymentAmount(financing: Financing) {
    return paymentAmounts[financing.id] ?? financing.installmentValue;
  }

  function setPaymentAmount(id: number, value: string) {
    setPaymentAmounts((prev) => ({ ...prev, [id]: value }));
  }

  async function handlePayInstallment(financing: Financing) {
    const amount = paymentAmounts[financing.id] ?? financing.installmentValue;
    await api.put(`/financings/${financing.id}/pay-installment`, { amount });
    setPaymentAmounts((prev) => ({ ...prev, [financing.id]: "" }));
    loadData();
  }

  async function handleDeleteFinancing(id: number) {
    await api.delete(`/financings/${id}`);
    loadData();
  }

  async function handleCreateInsurance(e: FormEvent) {
    e.preventDefault();
    await api.post("/insurances", {
      vehicleId: Number(insVehicleId),
      monthlyValue: insValue,
      dueDay: Number(insDueDay),
    });
    setInsVehicleId("");
    setInsValue("");
    setInsDueDay("");
    loadData();
  }

  async function handlePayMonth(id: number) {
    await api.put(`/insurances/${id}/pay-month`);
    loadData();
  }

  async function handleDeleteInsurance(id: number) {
    await api.delete(`/insurances/${id}`);
    loadData();
  }

  const inputClass = "px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900";

  if (loading) return <p className="text-gray-500">Carregando...</p>;

  const totalFinancingRemaining = financings.reduce(
    (sum, f) => sum + Number(f.installmentValue) * (f.totalInstallments - f.paidInstallments),
    0
  );
  const totalMonthlyCommitment =
    financings.filter((f) => f.status === "active").reduce((sum, f) => sum + Number(f.installmentValue), 0) +
    insurances.filter((i) => i.status === "active").reduce((sum, i) => sum + Number(i.monthlyValue), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Financiamentos e Seguros</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Falta pagar de financiamento</p>
          <p className="text-2xl font-bold text-red-600">R$ {totalFinancingRemaining.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Compromisso mensal fixo</p>
          <p className="text-2xl font-bold text-gray-900">R$ {totalMonthlyCommitment.toFixed(2)}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Financiamentos</h2>

      <form onSubmit={handleCreateFinancing} className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex gap-3 flex-wrap items-center shadow-sm">
        <select className={inputClass} value={finVehicleId} onChange={(e) => setFinVehicleId(e.target.value)} required>
          <option value="">Veículo</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.plate}</option>
          ))}
        </select>
        <input className={inputClass + " w-28"} placeholder="Valor parcela" type="number" step="0.01" value={finValue} onChange={(e) => setFinValue(e.target.value)} required />
        <input className={inputClass + " w-24"} placeholder="Dia venc." type="number" min="1" max="31" value={finDueDay} onChange={(e) => setFinDueDay(e.target.value)} required />
        <input className={inputClass + " w-24"} placeholder="Qtd parcelas" type="number" value={finTotal} onChange={(e) => setFinTotal(e.target.value)} required />
        <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
          Adicionar
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Placa</th>
              <th className="px-4 py-3 font-medium">Valor parcela</th>
              <th className="px-4 py-3 font-medium">Venc.</th>
              <th className="px-4 py-3 font-medium">Parcelas</th>
              <th className="px-4 py-3 font-medium">Pagas</th>
              <th className="px-4 py-3 font-medium">Faltam</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {financings.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{vehiclePlate(f.vehicleId)}</td>
                <td className="px-4 py-3 text-gray-600">R$ {f.installmentValue}</td>
                <td className="px-4 py-3 text-gray-600">Dia {f.dueDay}</td>
                <td className="px-4 py-3 text-gray-600">{f.totalInstallments}</td>
                <td className="px-4 py-3 text-gray-600">{f.paidInstallments}</td>
                <td className="px-4 py-3 text-gray-600">{f.totalInstallments - f.paidInstallments}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    f.status === "active" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                  }`}>
                    {f.status === "active" ? "Ativo" : "Quitado"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {f.status === "active" && (
                    <span className="inline-flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                        value={getPaymentAmount(f)}
                        onChange={(e) => setPaymentAmount(f.id, e.target.value)}
                      />
                      <button onClick={() => handlePayInstallment(f)} className="text-gray-600 hover:text-gray-900 font-medium">
                        Pagar parcela
                      </button>
                    </span>
                  )}
                  <button onClick={() => handleDeleteFinancing(f.id)} className="text-red-600 hover:text-red-800 font-medium ml-2">
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Seguros</h2>

      <form onSubmit={handleCreateInsurance} className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex gap-3 flex-wrap items-center shadow-sm">
        <select className={inputClass} value={insVehicleId} onChange={(e) => setInsVehicleId(e.target.value)} required>
          <option value="">Veículo</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.plate}</option>
          ))}
        </select>
        <input className={inputClass + " w-28"} placeholder="Valor mensal" type="number" step="0.01" value={insValue} onChange={(e) => setInsValue(e.target.value)} required />
        <input className={inputClass + " w-24"} placeholder="Dia venc." type="number" min="1" max="31" value={insDueDay} onChange={(e) => setInsDueDay(e.target.value)} required />
        <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
          Adicionar
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Placa</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Venc.</th>
              <th className="px-4 py-3 font-medium">Último pagamento</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {insurances.map((i) => (
              <tr key={i.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{vehiclePlate(i.vehicleId)}</td>
                <td className="px-4 py-3 text-gray-600">R$ {i.monthlyValue}</td>
                <td className="px-4 py-3 text-gray-600">Dia {i.dueDay}</td>
                <td className="px-4 py-3 text-gray-600">{i.lastPaidAt ?? "-"}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => handlePayMonth(i.id)} className="text-gray-600 hover:text-gray-900 font-medium">
                    Registrar pagamento
                  </button>
                  <button onClick={() => handleDeleteInsurance(i.id)} className="text-red-600 hover:text-red-800 font-medium">
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}