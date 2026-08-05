import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, RefreshControl, Modal,
  TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api/client";

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

interface Vehicle { id: number; plate: string; }
interface Driver { id: number; name: string; }

const categories = [
  { value: "aluguel", label: "Aluguel" },
  { value: "manutencao", label: "Manutenção" },
  { value: "combustivel", label: "Combustível" },
  { value: "financiamento", label: "Financiamento" },
  { value: "seguro", label: "Seguro" },
  { value: "outro", label: "Outro" },
];

const statusOptions = [
  { value: "pending", label: "Pendente" },
  { value: "paid", label: "Pago" },
  { value: "overdue", label: "Atrasado" },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#fef3c7", text: "#d97706" },
  paid: { bg: "#d1fae5", text: "#059669" },
  overdue: { bg: "#fee2e2", text: "#dc2626" },
};

const categoryLabels: Record<string, string> = Object.fromEntries(categories.map((c) => [c.value, c.label]));

export default function Financial() {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [direction, setDirection] = useState("in");
  const [category, setCategory] = useState("aluguel");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [status, setStatus] = useState("pending");
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [driverId, setDriverId] = useState<number | null>(null);

  async function loadData() {
    const [entRes, vehRes, drvRes] = await Promise.all([
      api.get("/financial-entries"),
      api.get("/vehicles"),
      api.get("/drivers"),
    ]);
    setEntries(entRes.data);
    setVehicles(vehRes.data);
    setDrivers(drvRes.data);
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
    setDirection("in");
    setCategory("aluguel");
    setDescription("");
    setAmount("");
    setDueAt("");
    setPaidAt("");
    setStatus("pending");
    setVehicleId(null);
    setDriverId(null);
    setEditingId(null);
  }

  function openCreateModal() {
    resetForm();
    setModalVisible(true);
  }

  function openEditModal(entry: FinancialEntry) {
    setEditingId(entry.id);
    setDirection(entry.direction);
    setCategory(entry.category);
    setDescription(entry.description);
    setAmount(entry.amount);
    setDueAt(entry.dueAt);
    setPaidAt(entry.paidAt ?? "");
    setStatus(entry.status);
    setVehicleId(entry.vehicleId);
    setDriverId(entry.driverId);
    setModalVisible(true);
  }

  async function handleSave() {
    if (editingId) {
      await api.put(`/financial-entries/${editingId}`, {
        direction, category, description, amount, dueAt, paidAt: paidAt || null, status,
      });
    } else {
      await api.post("/financial-entries", {
        direction, category, description, amount, dueAt, vehicleId, driverId,
      });
    }
    setModalVisible(false);
    resetForm();
    loadData();
  }

  async function handleDelete(id: number) {
    await api.delete(`/financial-entries/${id}`);
    setModalVisible(false);
    resetForm();
    loadData();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const colors = statusColors[item.status] ?? { bg: "#f1f5f9", text: "#64748b" };
          return (
            <TouchableOpacity style={styles.card} onPress={() => openEditModal(item)}>
              <View style={styles.iconBadge}>
                <Ionicons
                  name={item.direction === "in" ? "arrow-down-circle-outline" : "arrow-up-circle-outline"}
                  size={20}
                  color={item.direction === "in" ? "#059669" : "#dc2626"}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.description}>{item.description}</Text>
                <Text style={styles.category}>{categoryLabels[item.category] ?? item.category} · {item.dueAt}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.amount, { color: item.direction === "in" ? "#059669" : "#dc2626" }]}>
                  R$ {item.amount}
                </Text>
                <View style={[styles.pill, { backgroundColor: colors.bg, marginTop: 4 }]}>
                  <Text style={[styles.pillText, { color: colors.text }]}>
                    {statusOptions.find((s) => s.value === item.status)?.label ?? item.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? "Editar lançamento" : "Novo lançamento"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Tipo</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, direction === "in" && styles.chipActiveGreen]}
                  onPress={() => setDirection("in")}
                >
                  <Text style={[styles.chipText, direction === "in" && styles.chipTextActive]}>Entrada</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, direction === "out" && styles.chipActiveRed]}
                  onPress={() => setDirection("out")}
                >
                  <Text style={[styles.chipText, direction === "out" && styles.chipTextActive]}>Saída</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Categoria</Text>
              <View style={styles.chipRow}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    style={[styles.chip, category === c.value && styles.chipActive]}
                    onPress={() => setCategory(c.value)}
                  >
                    <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Descrição</Text>
              <TextInput style={styles.input} value={description} onChangeText={setDescription} />

              <Text style={styles.label}>Valor</Text>
              <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

              <Text style={styles.label}>Vencimento (AAAA-MM-DD)</Text>
              <TextInput style={styles.input} value={dueAt} onChangeText={setDueAt} placeholder="2026-08-05" />

              {!editingId && (
                <>
                  <Text style={styles.label}>Veículo (opcional)</Text>
                  <View style={styles.chipRow}>
                    <TouchableOpacity
                      style={[styles.chip, vehicleId === null && styles.chipActive]}
                      onPress={() => setVehicleId(null)}
                    >
                      <Text style={[styles.chipText, vehicleId === null && styles.chipTextActive]}>Nenhum</Text>
                    </TouchableOpacity>
                    {vehicles.map((v) => (
                      <TouchableOpacity
                        key={v.id}
                        style={[styles.chip, vehicleId === v.id && styles.chipActive]}
                        onPress={() => setVehicleId(v.id)}
                      >
                        <Text style={[styles.chipText, vehicleId === v.id && styles.chipTextActive]}>{v.plate}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Motorista (opcional)</Text>
                  <View style={styles.chipRow}>
                    <TouchableOpacity
                      style={[styles.chip, driverId === null && styles.chipActive]}
                      onPress={() => setDriverId(null)}
                    >
                      <Text style={[styles.chipText, driverId === null && styles.chipTextActive]}>Nenhum</Text>
                    </TouchableOpacity>
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
                </>
              )}

              {editingId && (
                <>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.chipRow}>
                    {statusOptions.map((s) => (
                      <TouchableOpacity
                        key={s.value}
                        style={[styles.chip, status === s.value && styles.chipActive]}
                        onPress={() => setStatus(s.value)}
                      >
                        <Text style={[styles.chipText, status === s.value && styles.chipTextActive]}>{s.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Data de pagamento (AAAA-MM-DD)</Text>
                  <TextInput style={styles.input} value={paidAt} onChangeText={setPaidAt} placeholder="2026-08-05" />
                </>
              )}

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>{editingId ? "Salvar" : "Adicionar"}</Text>
              </TouchableOpacity>

              {editingId && (
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(editingId)}>
                  <Text style={styles.deleteButtonText}>Excluir lançamento</Text>
                </TouchableOpacity>
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
    borderWidth: 1, borderColor: "#e2e8f0", flexDirection: "row", alignItems: "center",
    shadowColor: "#94a3b8", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  iconBadge: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center" },
  description: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  category: { fontSize: 12, color: "#64748b", marginTop: 2 },
  amount: { fontSize: 15, fontWeight: "bold" },
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
  chipActiveGreen: { backgroundColor: "#059669", borderColor: "#059669" },
  chipActiveRed: { backgroundColor: "#dc2626", borderColor: "#dc2626" },
  chipText: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  saveButton: { backgroundColor: "#4f46e5", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  saveButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  deleteButton: { paddingVertical: 14, alignItems: "center", marginTop: 8, marginBottom: 20 },
  deleteButtonText: { color: "#dc2626", fontWeight: "600", fontSize: 14 },
});