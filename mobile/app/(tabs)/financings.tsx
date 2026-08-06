import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Modal,
  TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api/client";

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

interface Vehicle { id: number; plate: string; }

export default function Financings() {
  const [financings, setFinancings] = useState<Financing[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [finModalVisible, setFinModalVisible] = useState(false);
  const [insModalVisible, setInsModalVisible] = useState(false);
  const [payAmounts, setPayAmounts] = useState<Record<number, string>>({});

  const [finVehicleId, setFinVehicleId] = useState<number | null>(null);
  const [finValue, setFinValue] = useState("");
  const [finDueDay, setFinDueDay] = useState("");
  const [finTotal, setFinTotal] = useState("");

  const [insVehicleId, setInsVehicleId] = useState<number | null>(null);
  const [insValue, setInsValue] = useState("");
  const [insDueDay, setInsDueDay] = useState("");

  async function loadData() {
    const [finRes, insRes, vehRes] = await Promise.all([
      api.get("/financings"),
      api.get("/insurances"),
      api.get("/vehicles"),
    ]);
    setFinancings(finRes.data);
    setInsurances(insRes.data);
    setVehicles(vehRes.data);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function vehiclePlate(id: number) {
    return vehicles.find((v) => v.id === id)?.plate ?? "-";
  }

  async function handleCreateFinancing() {
    await api.post("/financings", {
      vehicleId: finVehicleId,
      installmentValue: finValue,
      dueDay: Number(finDueDay),
      totalInstallments: Number(finTotal),
    });
    setFinVehicleId(null);
    setFinValue("");
    setFinDueDay("");
    setFinTotal("");
    setFinModalVisible(false);
    loadData();
  }

  async function handlePayInstallment(financing: Financing) {
    const amount = payAmounts[financing.id] ?? financing.installmentValue;
    await api.put(`/financings/${financing.id}/pay-installment`, { amount });
    setPayAmounts((prev) => ({ ...prev, [financing.id]: "" }));
    loadData();
  }

  async function handleDeleteFinancing(id: number) {
    await api.delete(`/financings/${id}`);
    loadData();
  }

  async function handleCreateInsurance() {
    await api.post("/insurances", {
      vehicleId: insVehicleId,
      monthlyValue: insValue,
      dueDay: Number(insDueDay),
    });
    setInsVehicleId(null);
    setInsValue("");
    setInsDueDay("");
    setInsModalVisible(false);
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

  const totalFinancingRemaining = financings.reduce(
    (sum, f) => sum + Number(f.installmentValue) * (f.totalInstallments - f.paidInstallments), 0
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.cardLabel}>Falta pagar de financiamento</Text>
          <Text style={[styles.cardValue, { color: "#dc2626" }]}>R$ {totalFinancingRemaining.toFixed(2)}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Financiamentos</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setFinModalVisible(true)}>
            <Ionicons name="add" size={18} color="#4f46e5" />
          </TouchableOpacity>
        </View>

        {financings.map((f) => (
          <View key={f.id} style={styles.card}>
            <View style={styles.cardTopRow}>
              <Text style={styles.plate}>{vehiclePlate(f.vehicleId)}</Text>
              <View style={[styles.pill, { backgroundColor: f.status === "active" ? "#dbeafe" : "#d1fae5" }]}>
                <Text style={[styles.pillText, { color: f.status === "active" ? "#2563eb" : "#059669" }]}>
                  {f.status === "active" ? "Ativo" : "Quitado"}
                </Text>
              </View>
            </View>
            <Text style={styles.detail}>Parcela R$ {f.installmentValue} · Dia {f.dueDay}</Text>
            <Text style={styles.detail}>{f.paidInstallments}/{f.totalInstallments} parcelas pagas</Text>

            {f.status === "active" && (
              <View style={styles.payRow}>
                <TextInput
                  style={styles.payInput}
                  keyboardType="decimal-pad"
                  value={payAmounts[f.id] ?? f.installmentValue}
                  onChangeText={(v) => setPayAmounts((prev) => ({ ...prev, [f.id]: v }))}
                />
                <TouchableOpacity style={styles.payButton} onPress={() => handlePayInstallment(f)}>
                  <Text style={styles.payButtonText}>Pagar parcela</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={() => handleDeleteFinancing(f.id)} style={{ marginTop: 8 }}>
              <Text style={styles.deleteText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Seguros</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setInsModalVisible(true)}>
            <Ionicons name="add" size={18} color="#4f46e5" />
          </TouchableOpacity>
        </View>

        {insurances.map((i) => (
          <View key={i.id} style={styles.card}>
            <View style={styles.cardTopRow}>
              <Text style={styles.plate}>{vehiclePlate(i.vehicleId)}</Text>
            </View>
            <Text style={styles.detail}>R$ {i.monthlyValue} · Dia {i.dueDay}</Text>
            <Text style={styles.detail}>Último pagamento: {i.lastPaidAt ?? "-"}</Text>
            <View style={styles.payRow}>
              <TouchableOpacity style={[styles.payButton, { flex: 1 }]} onPress={() => handlePayMonth(i.id)}>
                <Text style={styles.payButtonText}>Registrar pagamento</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => handleDeleteInsurance(i.id)} style={{ marginTop: 8 }}>
              <Text style={styles.deleteText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={finModalVisible} animationType="slide" transparent onRequestClose={() => setFinModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo financiamento</Text>
              <TouchableOpacity onPress={() => setFinModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.label}>Veículo</Text>
              <View style={styles.chipRow}>
                {vehicles.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.chip, finVehicleId === v.id && styles.chipActive]}
                    onPress={() => setFinVehicleId(v.id)}
                  >
                    <Text style={[styles.chipText, finVehicleId === v.id && styles.chipTextActive]}>{v.plate}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Valor da parcela</Text>
              <TextInput style={styles.input} value={finValue} onChangeText={setFinValue} keyboardType="decimal-pad" />
              <Text style={styles.label}>Dia de vencimento</Text>
              <TextInput style={styles.input} value={finDueDay} onChangeText={setFinDueDay} keyboardType="number-pad" />
              <Text style={styles.label}>Total de parcelas</Text>
              <TextInput style={styles.input} value={finTotal} onChangeText={setFinTotal} keyboardType="number-pad" />
              <TouchableOpacity style={styles.saveButton} onPress={handleCreateFinancing}>
                <Text style={styles.saveButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={insModalVisible} animationType="slide" transparent onRequestClose={() => setInsModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo seguro</Text>
              <TouchableOpacity onPress={() => setInsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.label}>Veículo</Text>
              <View style={styles.chipRow}>
                {vehicles.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.chip, insVehicleId === v.id && styles.chipActive]}
                    onPress={() => setInsVehicleId(v.id)}
                  >
                    <Text style={[styles.chipText, insVehicleId === v.id && styles.chipTextActive]}>{v.plate}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Valor mensal</Text>
              <TextInput style={styles.input} value={insValue} onChangeText={setInsValue} keyboardType="decimal-pad" />
              <Text style={styles.label}>Dia de vencimento</Text>
              <TextInput style={styles.input} value={insDueDay} onChangeText={setInsDueDay} keyboardType="number-pad" />
              <TouchableOpacity style={styles.saveButton} onPress={handleCreateInsurance}>
                <Text style={styles.saveButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  summaryCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  cardLabel: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  cardValue: { fontSize: 24, fontWeight: "bold", marginTop: 4 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#0f172a" },
  addButton: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  plate: { fontSize: 15, fontWeight: "bold", color: "#0f172a" },
  detail: { fontSize: 12, color: "#64748b", marginTop: 4 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: "600" },
  payRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  payInput: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, width: 90 },
  payButton: { backgroundColor: "#4f46e5", borderRadius: 8, paddingVertical: 9, paddingHorizontal: 12, alignItems: "center" },
  payButtonText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  deleteText: { color: "#dc2626", fontSize: 12, fontWeight: "600" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.4)" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  label: { fontSize: 13, fontWeight: "500", color: "#334155", marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  chipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  chipText: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  saveButton: { backgroundColor: "#4f46e5", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 20, marginBottom: 20 },
  saveButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});