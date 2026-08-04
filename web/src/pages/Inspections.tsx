import { useEffect, useState, FormEvent } from "react";
import { AlertTriangle, Camera, Plus, Eye, X } from "lucide-react";
import { api } from "../api/client";

const checklistItems = [
  "Pintura", "Capô", "Tampa traseira", "Amassados",
  "Para-lama dianteiro LD", "Para-lama dianteiro LE",
  "Para-lama traseiro LD", "Para-lama traseiro LE",
  "Retrovisor LD", "Retrovisor LE", "Faróis LD/LE",
  "Lanternas dianteiras LD/LE", "Lanternas traseiras LD/LE",
  "Para-choque dianteiro", "Para-choque traseiro", "Motor",
  "Pneus/Rodas/Calotas", "Estepe", "Teto", "Tampão", "Bancos", "Painel interno",
];

const stateOptions = ["Ok", "Riscado", "Amassado", "Quebrado", "Faltando"];

interface ChecklistEntry {
  estado: string;
  observacao: string;
}

interface Inspection {
  id: number;
  vehicleId: number;
  driverId: number;
  inspectedAt: string;
  km: number;
  color: string | null;
  checklist: string;
  generalNotes: string | null;
  photos: { id: number; filename: string }[];
}

interface Alert {
  contractId: number;
  vehicleId: number;
  driverId: number;
  plate: string;
  driverName: string;
  nextDueDate: string;
  daysRemaining: number;
  status: string;
}

interface Vehicle {
  id: number;
  plate: string;
  model: string;
}

interface Driver {
  id: number;
  name: string;
}

interface Contract {
  id: number;
  vehicleId: number;
  driverId: number;
  status: string;
}

const stateColors: Record<string, string> = {
  Ok: "bg-emerald-100 text-emerald-700",
  Riscado: "bg-amber-100 text-amber-700",
  Amassado: "bg-orange-100 text-orange-700",
  Quebrado: "bg-red-100 text-red-700",
  Faltando: "bg-red-100 text-red-700",
};

export function Inspections() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingInspection, setViewingInspection] = useState<Inspection | null>(null);

  const [contractId, setContractId] = useState("");
  const [km, setKm] = useState("");
  const [color, setColor] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [checklist, setChecklist] = useState<Record<string, ChecklistEntry>>(
    Object.fromEntries(checklistItems.map((item) => [item, { estado: "Ok", observacao: "" }]))
  );
  const [photos, setPhotos] = useState<FileList | null>(null);

  async function loadData() {
    const [inspRes, alertsRes, vehRes, drvRes, ctrRes] = await Promise.all([
      api.get("/inspections"),
      api.get("/inspections/alerts"),
      api.get("/vehicles"),
      api.get("/drivers"),
      api.get("/contracts"),
    ]);
    setInspections(inspRes.data);
    setAlerts(alertsRes.data);
    setVehicles(vehRes.data);
    setDrivers(drvRes.data);
    setContracts(ctrRes.data.filter((c: Contract) => c.status === "active"));
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function vehiclePlate(id: number) {
    return vehicles.find((v) => v.id === id)?.plate ?? "-";
  }

  function driverName(id: number) {
    return drivers.find((d) => d.id === id)?.name ?? "-";
  }

  function updateChecklistItem(item: string, field: "estado" | "observacao", value: string) {
    setChecklist((prev) => ({ ...prev, [item]: { ...prev[item], [field]: value } }));
  }

  function resetForm() {
    setContractId("");
    setKm("");
    setColor("");
    setGeneralNotes("");
    setChecklist(Object.fromEntries(checklistItems.map((item) => [item, { estado: "Ok", observacao: "" }])));
    setPhotos(null);
    setShowForm(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const contract = contracts.find((c) => c.id === Number(contractId));
    if (!contract) return;

    const formData = new FormData();
    formData.append("vehicleId", String(contract.vehicleId));
    formData.append("driverId", String(contract.driverId));
    formData.append("contractId", contractId);
    formData.append("km", km);
    formData.append("color", color);
    formData.append("checklist", JSON.stringify(checklist));
    formData.append("generalNotes", generalNotes);

    if (photos) {
      Array.from(photos).forEach((file) => formData.append("photos", file));
    }

    await api.post("/inspections", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    resetForm();
    loadData();
  }

  function startFromAlert(alert: Alert) {
    setContractId(String(alert.contractId));
    setShowForm(true);
  }

  function parseChecklist(raw: string): Record<string, ChecklistEntry> {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  if (loading) return <p className="text-slate-500">Carregando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Vistorias</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={16} />
          Nova vistoria
        </button>
      </div>

      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.contractId}
              className={`flex items-center justify-between p-4 rounded-xl border ${
                alert.status === "overdue" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className={alert.status === "overdue" ? "text-red-600" : "text-amber-600"} />
                <span className="text-sm text-slate-700">
                  <strong>{alert.plate}</strong> ({alert.driverName}) —{" "}
                  {alert.status === "overdue"
                    ? `vistoria atrasada há ${Math.abs(alert.daysRemaining)} dia(s)`
                    : `vistoria vence em ${alert.daysRemaining} dia(s)`}
                </span>
              </div>
              <button
                onClick={() => startFromAlert(alert)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                Realizar agora
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm shadow-slate-200/50 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Informações gerais</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm col-span-2"
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                required
              >
                <option value="">Contrato (veículo/motorista)</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {vehiclePlate(c.vehicleId)} — {driverName(c.driverId)}
                  </option>
                ))}
              </select>
              <input
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                placeholder="Cor"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <input
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                placeholder="KM"
                type="number"
                value={km}
                onChange={(e) => setKm(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Checklist de itens</h2>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-slate-500">
                    <th className="px-3 py-2 font-medium">Item</th>
                    <th className="px-3 py-2 font-medium w-32">Estado</th>
                    <th className="px-3 py-2 font-medium">Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {checklistItems.map((item) => (
                    <tr key={item}>
                      <td className="px-3 py-2 text-slate-700">{item}</td>
                      <td className="px-3 py-2">
                        <select
                          className="px-2 py-1 border border-slate-200 rounded-md text-xs w-full"
                          value={checklist[item].estado}
                          onChange={(e) => updateChecklistItem(item, "estado", e.target.value)}
                        >
                          {stateOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="px-2 py-1 border border-slate-200 rounded-md text-xs w-full"
                          value={checklist[item].observacao}
                          onChange={(e) => updateChecklistItem(item, "observacao", e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Observações gerais</h2>
            <textarea
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              rows={3}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Camera size={16} /> Fotos da vistoria
            </h2>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(e.target.files)}
              className="text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Salvar vistoria
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm shadow-slate-200/50">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Placa</th>
              <th className="px-4 py-3 font-medium">Motorista</th>
              <th className="px-4 py-3 font-medium">KM</th>
              <th className="px-4 py-3 font-medium">Fotos</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inspections.map((insp) => (
              <tr key={insp.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-slate-600">{new Date(insp.inspectedAt).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{vehiclePlate(insp.vehicleId)}</td>
                <td className="px-4 py-3 text-slate-600">{driverName(insp.driverId)}</td>
                <td className="px-4 py-3 text-slate-600">{insp.km.toLocaleString("pt-BR")}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {insp.photos.slice(0, 3).map((photo) => (
                      <img
                        key={photo.id}
                        src={`http://localhost:3333/uploads/inspections/${photo.filename}`}
                        className="w-8 h-8 rounded object-cover border border-slate-200"
                      />
                    ))}
                    {insp.photos.length > 3 && (
                      <span className="text-xs text-slate-400 self-center">+{insp.photos.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setViewingInspection(insp)}
                    className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium text-sm ml-auto"
                  >
                    <Eye size={16} />
                    Ver detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewingInspection && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50" onClick={() => setViewingInspection(null)}>
          <div
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-900">
                Vistoria — {vehiclePlate(viewingInspection.vehicleId)}
              </h2>
              <button onClick={() => setViewingInspection(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Motorista</p>
                  <p className="font-medium text-slate-900">{driverName(viewingInspection.driverId)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Data</p>
                  <p className="font-medium text-slate-900">{new Date(viewingInspection.inspectedAt).toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-slate-500">KM</p>
                  <p className="font-medium text-slate-900">{viewingInspection.km.toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-slate-500">Cor</p>
                  <p className="font-medium text-slate-900">{viewingInspection.color ?? "-"}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Checklist</h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-left text-slate-500">
                        <th className="px-3 py-2 font-medium">Item</th>
                        <th className="px-3 py-2 font-medium w-28">Estado</th>
                        <th className="px-3 py-2 font-medium">Observação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(parseChecklist(viewingInspection.checklist)).map(([item, entry]) => (
                        <tr key={item}>
                          <td className="px-3 py-2 text-slate-700">{item}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stateColors[entry.estado] ?? "bg-slate-100 text-slate-600"}`}>
                              {entry.estado}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-600">{entry.observacao || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {viewingInspection.generalNotes && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Observações gerais</h3>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{viewingInspection.generalNotes}</p>
                </div>
              )}

              {viewingInspection.photos.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Fotos</h3>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {viewingInspection.photos.map((photo) => (
                      <img
                        key={photo.id}
                        src={`http://localhost:3333/uploads/inspections/${photo.filename}`}
                        className="w-full h-28 rounded-lg object-cover border border-slate-200"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}