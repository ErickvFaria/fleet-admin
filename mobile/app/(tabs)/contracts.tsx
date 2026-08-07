import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, RefreshControl, Modal,
  TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api/client";

interface Contract {
  id: number;
  driverId: number;
  vehicleId: number;
  startDate: string;
  termEndDate: string | null;
  paymentDayOfWeek: number;
  weeklyRate: string;
  status: string;
}

interface Driver { id: number; name: string; }
interface Vehicle { id: number; plate: string; status: string; }

const weekDays = [
  { value: 0, label: "Dom" }, { value: 1, label: "Seg" }, { value: 2, label: "Ter" },
  { value: 3, label: "Qua" }, { value: 4, label: "Qui" }, { value: 5, label: "Sex" }, { value: 6, label: "Sáb" },
];

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [driverId, setDriverId] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [termEndDate, setTermEndDate] = useState("");
  const [paymentDayOfWeek, setPaymentDayOfWeek] = useState(1);
  const [weeklyRate, setWeeklyRate] = useState("");

  async function loadData() {
    const [ctrRes, drvRes, vehRes] = await Promise.all([
      api.get("/contracts"),
      api.get("/drivers"),
      api.get("/vehicles"),
    ]);
    setContracts(ctrRes.data);
    setDrivers(drvRes.data);
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

  function resetForm() {
    setDriverId(null);
    setVehicleId(null);
    setStartDate("");
    setTermEndDate("");
    setPaymentDayOfWeek(1);
    setWeeklyRate("");
    setEditingId(null);
  }

  function openCreateModal() {
    resetForm();
    setModalVisible(true);
  }

  function openEditModal(contract: Contract) {
    setEditingId(contract.id);
    setDriverId(contract.driverId);
    setVehicleId(contract.vehicleId);
    setStartDate(contract.startDate);
    setTermEndDate(contract.termEndDate ?? "");
    setPaymentDayOfWeek(contract.paymentDayOfWeek);
    setWeeklyRate(contract.weeklyRate);
    setModalVisible(true);
  }

  async function handleSave() {
    if (editingId) {
      await api.put(`/contracts/${editingId}`, {
        startDate, termEndDate: termEndDate || null, paymentDayOfWeek, weeklyRate,
      });
    } else {
      await api.post("/contracts", {
        driverId, vehicleId, startDate, termEndDate: termEndDate || null, paymentDayOfWeek, weeklyRate,
      });
    }
    setModalVisible(false);
    resetForm();
    loadData();
  }

  async function handleFinish(id: number) {
    const endDate = new Date().toISOString().slice(0, 10);
    await api.put(`/contracts/${id}/finish`, { endDate });
    setModalVisible(false);
    resetForm();
    loadData();
  }

  async function handleDelete(id: number) {
    await api.delete(`/contracts/${id}`);
    setModalVisible(false);
    resetForm();
    loadData();
  }

  function driverName(id: number) {
    return drivers.find((d) => d.id === id)?.name ?? "-";
  }

  function vehiclePlate(id: number) {
    return vehicles.find((v) => v.id === id)?.plate ?? "-";
  }

  const availableVehicles = vehicles.filter((v) => v.status === "available");

  return (
    <View style={styles.container}>
      <FlatList
        data={contracts}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openEditModal(item)}>
            <View style={styles.cardTopRow}>
              <Text style={styles.name}>{driverName(item.driverId)}</Text>
              <View style={[styles.pill, { backgroundColor: item.status === "active" ? "#d1fae5" : "#f1f5f9" }]}>
                <Text style={[styles.pillText, { color: item.status === "active" ? "#059669" : "#64748b" }]}>
                  {item.status === "active" ? "Ativo" : "Encerrado"}
                </Text>
              </View>
            </View>
            <Text style={styles.detail}>{vehiclePlate(item.vehicleId)} · R$ {item.weeklyRate}/semana</Text>
            <Text style={styles.detail}>
              Pagamento: {weekDays.find((d) => d.value === item.paymentDayOfWeek)?.label} · Término: {item.termEndDate ?? "-"}
            </Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? "Editar contrato" : "Novo contrato"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {!editingId && (
                <>
                  <Text style={styles.label}>Motorista</Text>
                  <View style={styles.chipRow}>
                    {drivers.map((d) => (
                      <TouchableOpacity
                        key={d.id}
                        style={[styles.chip, driverId === d.id && styles.chipActive]}
                        onPress={() => setDriverId(d.id)}
                      >
                        <Text style={[styles.chipText, driverId === d.id && styles.chipTextActive]}>{d.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Veículo</Text>
                  <View style={styles.chipRow}>
                    {availableVehicles.map((v) => (
                      <TouchableOpacity
                        key={v.id}
                        style={[styles.chip, vehicleId === v.id && styles.chipActive]}
                        onPress={() => setVehicleId(v.id)}
                      >
                        <Text style={[styles.chipText, vehicleId === v.id && styles.chipTextActive]}>{v.plate}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.label}>Início (AAAA-MM-DD)</Text>
              <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="2026-08-04" />

              <Text style={styles.label}>Término previsto (AAAA-MM-DD)</Text>
              <TextInput style={styles.input} value={termEndDate} onChangeText={setTermEndDate} placeholder="opcional" />

              <Text style={styles.label}>Dia de pagamento</Text>
              <View style={styles.chipRow}>
                {weekDays.map((d) => (
                  <TouchableOpacity
                    key={d.value}
                    style={[styles.chip, paymentDayOfWeek === d.value && styles.chipActive]}
                    onPress={() => setPaymentDayOfWeek(d.value)}
                  >
                    <Text style={[styles.chipText, paymentDayOfWeek === d.value && styles.chipTextActive]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Valor semanal</Text>
              <TextInput style={styles.input} value={weeklyRate} onChangeText={setWeeklyRate} keyboardType="decimal-pad" />

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>{editingId ? "Salvar" : "Criar contrato"}</Text>
              </TouchableOpacity>

              {editingId && (
                <>
                  <TouchableOpacity style={styles.finishButton} onPress={() => handleFinish(editingId)}>
                    <Text style={styles.finishButtonText}>Encerrar contrato</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(editingId)}>
                    <Text style={styles.deleteButtonText}>Excluir contrato</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#e2e8f0",
    shadowColor: "#94a3b8", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "bold", color: "#0f172a" },
  detail: { fontSize: 12, color: "#64748b", marginTop: 4 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: "600" },
  fab: {
    position: "absolute", right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#4f46e5", alignItems: "center", justifyContent: "center",
    shadowColor: "#4f46e5", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.4)" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "88%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  label: { fontSize: 13, fontWeight: "500", color: "#334155", marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  chipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  chipText: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  saveButton: { backgroundColor: "#4f46e5", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  saveButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  finishButton: { paddingVertical: 12, alignItems: "center", marginTop: 8, borderWidth: 1, borderColor: "#4f46e5", borderRadius: 10 },
  finishButtonText: { color: "#4f46e5", fontWeight: "600", fontSize: 14 },
  deleteButton: { paddingVertical: 14, alignItems: "center", marginTop: 8, marginBottom: 20 },
  deleteButtonText: { color: "#dc2626", fontWeight: "600", fontSize: 14 },
});