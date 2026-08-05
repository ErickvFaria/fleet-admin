import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, RefreshControl, Modal,
  TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api/client";

interface Vehicle {
  id: number;
  plate: string;
  brand: string | null;
  model: string;
  year: number;
  currentKm: number;
  status: string;
}

const statusLabels: Record<string, string> = {
  available: "Disponível",
  rented: "Alugado",
  maintenance: "Manutenção",
};

const statusColors: Record<string, { bg: string; text: string }> = {
  available: { bg: "#d1fae5", text: "#059669" },
  rented: { bg: "#dbeafe", text: "#2563eb" },
  maintenance: { bg: "#fef3c7", text: "#d97706" },
};

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [currentKm, setCurrentKm] = useState("");
  const [status, setStatus] = useState("available");

  async function loadData() {
    const response = await api.get("/vehicles");
    setVehicles(response.data);
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
    setPlate("");
    setBrand("");
    setModel("");
    setYear("");
    setCurrentKm("");
    setStatus("available");
    setEditingId(null);
  }

  function openCreateModal() {
    resetForm();
    setModalVisible(true);
  }

  function openEditModal(vehicle: Vehicle) {
    setEditingId(vehicle.id);
    setPlate(vehicle.plate);
    setBrand(vehicle.brand ?? "");
    setModel(vehicle.model);
    setYear(String(vehicle.year));
    setCurrentKm(String(vehicle.currentKm));
    setStatus(vehicle.status);
    setModalVisible(true);
  }

  async function handleSave() {
    if (editingId) {
      await api.put(`/vehicles/${editingId}`, {
        plate, brand, model, year: Number(year), currentKm: Number(currentKm), status,
      });
    } else {
      await api.post("/vehicles", { plate, brand, model, year: Number(year), currentKm: 0 });
    }
    setModalVisible(false);
    resetForm();
    loadData();
  }

  async function handleDelete(id: number) {
    await api.delete(`/vehicles/${id}`);
    setModalVisible(false);
    resetForm();
    loadData();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const colors = statusColors[item.status] ?? { bg: "#f1f5f9", text: "#64748b" };
          return (
            <TouchableOpacity style={styles.card} onPress={() => openEditModal(item)}>
              <View style={styles.iconBadge}>
                <Ionicons name="car-sport-outline" size={20} color="#4f46e5" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.plate}>{item.plate}</Text>
                <Text style={styles.model}>{item.brand} {item.model}</Text>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? "Editar veículo" : "Novo veículo"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Placa</Text>
              <TextInput style={styles.input} value={plate} onChangeText={setPlate} autoCapitalize="characters" />

              <Text style={styles.label}>Marca</Text>
              <TextInput style={styles.input} value={brand} onChangeText={setBrand} />

              <Text style={styles.label}>Modelo</Text>
              <TextInput style={styles.input} value={model} onChangeText={setModel} />

              <Text style={styles.label}>Ano</Text>
              <TextInput style={styles.input} value={year} onChangeText={setYear} keyboardType="numeric" />

              {editingId && (
                <>
                  <Text style={styles.label}>KM</Text>
                  <TextInput style={styles.input} value={currentKm} onChangeText={setCurrentKm} keyboardType="numeric" />

                  <Text style={styles.label}>Status</Text>
                  <View style={styles.statusRow}>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <TouchableOpacity
                        key={value}
                        style={[styles.statusOption, status === value && styles.statusOptionActive]}
                        onPress={() => setStatus(value)}
                      >
                        <Text style={[styles.statusOptionText, status === value && styles.statusOptionTextActive]}>
                          {label}
                        </Text>
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
                  <Text style={styles.deleteButtonText}>Excluir veículo</Text>
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
  plate: { fontSize: 16, fontWeight: "bold", color: "#0f172a" },
  model: { fontSize: 13, color: "#64748b", marginTop: 2 },
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
  label: { fontSize: 13, fontWeight: "500", color: "#334155", marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  statusRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  statusOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  statusOptionActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  statusOptionText: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  statusOptionTextActive: { color: "#fff" },
  saveButton: { backgroundColor: "#4f46e5", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  saveButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  deleteButton: { paddingVertical: 14, alignItems: "center", marginTop: 8, marginBottom: 20 },
  deleteButtonText: { color: "#dc2626", fontWeight: "600", fontSize: 14 },
});