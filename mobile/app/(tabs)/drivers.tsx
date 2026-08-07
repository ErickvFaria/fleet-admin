import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, RefreshControl, Modal,
  TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api/client";

interface Driver {
  id: number;
  name: string;
  document: string;
  licenseNumber: string | null;
  currentVehicleId: number | null;
  status: string;
}

interface Vehicle { id: number; plate: string; model: string; }

const statusLabels: Record<string, string> = { active: "Ativo", inactive: "Inativo" };
const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: "#d1fae5", text: "#059669" },
  inactive: { bg: "#f1f5f9", text: "#64748b" },
};

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [currentVehicleId, setCurrentVehicleId] = useState<number | null>(null);
  const [status, setStatus] = useState("active");

  async function loadData() {
    const [drvRes, vehRes] = await Promise.all([api.get("/drivers"), api.get("/vehicles")]);
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
    setName("");
    setDocument("");
    setLicenseNumber("");
    setCurrentVehicleId(null);
    setStatus("active");
    setEditingId(null);
  }

  function openCreateModal() {
    resetForm();
    setModalVisible(true);
  }

  function openEditModal(driver: Driver) {
    setEditingId(driver.id);
    setName(driver.name);
    setDocument(driver.document);
    setLicenseNumber(driver.licenseNumber ?? "");
    setCurrentVehicleId(driver.currentVehicleId);
    setStatus(driver.status);
    setModalVisible(true);
  }

  async function handleSave() {
    const payload = { name, document, licenseNumber, currentVehicleId };
    if (editingId) {
      await api.put(`/drivers/${editingId}`, { ...payload, status });
    } else {
      await api.post("/drivers", payload);
    }
    setModalVisible(false);
    resetForm();
    loadData();
  }

  async function handleDelete(id: number) {
    await api.delete(`/drivers/${id}`);
    setModalVisible(false);
    resetForm();
    loadData();
  }

  function vehicleLabel(id: number | null) {
    if (!id) return "-";
    const v = vehicles.find((v) => v.id === id);
    return v ? `${v.plate} (${v.model})` : "-";
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={drivers}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const colors = statusColors[item.status] ?? { bg: "#f1f5f9", text: "#64748b" };
          return (
            <TouchableOpacity style={styles.card} onPress={() => openEditModal(item)}>
              <View style={styles.iconBadge}>
                <Ionicons name="person-outline" size={20} color="#4f46e5" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.detail}>{item.document} · {vehicleLabel(item.currentVehicleId)}</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: colors.bg }]}>
                <Text style={[styles.pillText, { color: colors.text }]}>
                  {statusLabels[item.status] ?? item.status}
                </Text>
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
              <Text style={styles.modalTitle}>{editingId ? "Editar motorista" : "Novo motorista"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Nome</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} />

              <Text style={styles.label}>CPF</Text>
              <TextInput style={styles.input} value={document} onChangeText={setDocument} keyboardType="number-pad" />

              <Text style={styles.label}>CNH</Text>
              <TextInput style={styles.input} value={licenseNumber} onChangeText={setLicenseNumber} />

              <Text style={styles.label}>Veículo vinculado</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, currentVehicleId === null && styles.chipActive]}
                  onPress={() => setCurrentVehicleId(null)}
                >
                  <Text style={[styles.chipText, currentVehicleId === null && styles.chipTextActive]}>Nenhum</Text>
                </TouchableOpacity>
                {vehicles.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.chip, currentVehicleId === v.id && styles.chipActive]}
                    onPress={() => setCurrentVehicleId(v.id)}
                  >
                    <Text style={[styles.chipText, currentVehicleId === v.id && styles.chipTextActive]}>{v.plate}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {editingId && (
                <>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.chipRow}>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <TouchableOpacity
                        key={value}
                        style={[styles.chip, status === value && styles.chipActive]}
                        onPress={() => setStatus(value)}
                      >
                        <Text style={[styles.chipText, status === value && styles.chipTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>{editingId ? "Salvar" : "Adicionar"}</Text>
              </TouchableOpacity>

              {editingId && (
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(editingId)}>
                  <Text style={styles.deleteButtonText}>Excluir motorista</Text>
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
  name: { fontSize: 16, fontWeight: "bold", color: "#0f172a" },
  detail: { fontSize: 12, color: "#64748b", marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: "600" },
  fab: {
    position: "absolute", right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#4f46e5", alignItems: "center", justifyContent: "center",
    shadowColor: "#4f46e5", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
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
  saveButton: { backgroundColor: "#4f46e5", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  saveButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  deleteButton: { paddingVertical: 14, alignItems: "center", marginTop: 8, marginBottom: 20 },
  deleteButtonText: { color: "#dc2626", fontWeight: "600", fontSize: 14 },
});