import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, RefreshControl, Modal,
  TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { api, API_URL } from "../../api/client";

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

interface ChecklistEntry { estado: string; observacao: string; }

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

interface Alert2 {
  contractId: number;
  vehicleId: number;
  driverId: number;
  plate: string;
  driverName: string;
  daysRemaining: number;
  status: string;
}

interface Vehicle { id: number; plate: string; }
interface Driver { id: number; name: string; }
interface Contract { id: number; vehicleId: number; driverId: number; status: string; }

export default function Inspections() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [alerts, setAlerts] = useState<Alert2[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [formVisible, setFormVisible] = useState(false);
  const [viewingInspection, setViewingInspection] = useState<Inspection | null>(null);

  const [contractId, setContractId] = useState<number | null>(null);
  const [km, setKm] = useState("");
  const [color, setColor] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [checklist, setChecklist] = useState<Record<string, ChecklistEntry>>(
    Object.fromEntries(checklistItems.map((item) => [item, { estado: "Ok", observacao: "" }]))
  );
  const [photos, setPhotos] = useState<{ uri: string; fileName: string }[]>([]);

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

  function driverName(id: number) {
    return drivers.find((d) => d.id === id)?.name ?? "-";
  }

  function updateChecklistItem(item: string, field: "estado" | "observacao", value: string) {
    setChecklist((prev) => ({ ...prev, [item]: { ...prev[item], [field]: value } }));
  }

  function resetForm() {
    setContractId(null);
    setKm("");
    setColor("");
    setGeneralNotes("");
    setChecklist(Object.fromEntries(checklistItems.map((item) => [item, { estado: "Ok", observacao: "" }])));
    setPhotos([]);
    setFormVisible(false);
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.6,
    });
    if (!result.canceled) {
      const newPhotos = result.assets.map((asset) => ({
        uri: asset.uri,
        fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  }

  function removePhoto(uri: string) {
    setPhotos((prev) => prev.filter((p) => p.uri !== uri));
  }

  async function handleSubmit() {
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) {
      Alert.alert("Selecione um contrato");
      return;
    }

    const formData = new FormData();
    formData.append("vehicleId", String(contract.vehicleId));
    formData.append("driverId", String(contract.driverId));
    formData.append("contractId", String(contractId));
    formData.append("km", km);
    formData.append("color", color);
    formData.append("checklist", JSON.stringify(checklist));
    formData.append("generalNotes", generalNotes);

    photos.forEach((photo, index) => {
      formData.append("photos", {
        uri: photo.uri,
        name: photo.fileName,
        type: "image/jpeg",
      } as any);
    });

    await api.post("/inspections", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    resetForm();
    loadData();
  }

  function parseChecklist(raw: string): Record<string, ChecklistEntry> {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={inspections}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
        ListHeaderComponent={
          alerts.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              {alerts.map((a) => (
                <View
                  key={a.contractId}
                  style={[
                    styles.alertCard,
                    { backgroundColor: a.status === "overdue" ? "#fee2e2" : "#fef3c7" },
                  ]}
                >
                  <Ionicons name="warning-outline" size={18} color={a.status === "overdue" ? "#dc2626" : "#d97706"} />
                  <Text style={styles.alertText}>
                    {a.plate} ({a.driverName}) —{" "}
                    {a.status === "overdue"
                      ? `atrasada há ${Math.abs(a.daysRemaining)}d`
                      : `vence em ${a.daysRemaining}d`}
                  </Text>
                </View>
              ))}
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setViewingInspection(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.plate}>{vehiclePlate(item.vehicleId)}</Text>
              <Text style={styles.detail}>{driverName(item.driverId)} · {new Date(item.inspectedAt).toLocaleDateString("pt-BR")}</Text>
              <Text style={styles.detail}>{item.km.toLocaleString("pt-BR")} km · {item.photos.length} foto(s)</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setFormVisible(true)}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      <Modal visible={formVisible} animationType="slide" transparent onRequestClose={resetForm}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova vistoria</Text>
              <TouchableOpacity onPress={resetForm}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Contrato</Text>
              <View style={styles.chipRow}>
                {contracts.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, contractId === c.id && styles.chipActive]}
                    onPress={() => setContractId(c.id)}
                  >
                    <Text style={[styles.chipText, contractId === c.id && styles.chipTextActive]}>
                      {vehiclePlate(c.vehicleId)} — {driverName(c.driverId)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>KM</Text>
              <TextInput style={styles.input} value={km} onChangeText={setKm} keyboardType="number-pad" />

              <Text style={styles.label}>Cor</Text>
              <TextInput style={styles.input} value={color} onChangeText={setColor} />

              <Text style={[styles.label, { marginTop: 20 }]}>Checklist</Text>
              {checklistItems.map((item) => (
                <View key={item} style={styles.checklistRow}>
                  <Text style={styles.checklistItem}>{item}</Text>
                  <View style={styles.chipRowSmall}>
                    {stateOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.chipSmall, checklist[item].estado === opt && styles.chipActive]}
                        onPress={() => updateChecklistItem(item, "estado", opt)}
                      >
                        <Text style={[styles.chipTextSmall, checklist[item].estado === opt && styles.chipTextActive]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.inputSmall}
                    placeholder="Observação"
                    value={checklist[item].observacao}
                    onChangeText={(v) => updateChecklistItem(item, "observacao", v)}
                  />
                </View>
              ))}

              <Text style={styles.label}>Observações gerais</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                multiline
                value={generalNotes}
                onChangeText={setGeneralNotes}
              />

              <Text style={styles.label}>Fotos</Text>
              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                <Ionicons name="camera-outline" size={18} color="#4f46e5" />
                <Text style={styles.photoButtonText}>Adicionar fotos</Text>
              </TouchableOpacity>

              <View style={styles.photoGrid}>
                {photos.map((photo) => (
                  <View key={photo.uri} style={styles.photoThumbWrapper}>
                    <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                    <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(photo.uri)}>
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                <Text style={styles.saveButtonText}>Salvar vistoria</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!viewingInspection} animationType="slide" transparent onRequestClose={() => setViewingInspection(null)}>
        <KeyboardAvoidingView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes da vistoria</Text>
              <TouchableOpacity onPress={() => setViewingInspection(null)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            {viewingInspection && (
              <ScrollView>
                <Text style={styles.detail}>Veículo: {vehiclePlate(viewingInspection.vehicleId)}</Text>
                <Text style={styles.detail}>Motorista: {driverName(viewingInspection.driverId)}</Text>
                <Text style={styles.detail}>KM: {viewingInspection.km.toLocaleString("pt-BR")}</Text>
                <Text style={styles.detail}>Cor: {viewingInspection.color ?? "-"}</Text>

                <Text style={[styles.label, { marginTop: 16 }]}>Checklist</Text>
                {Object.entries(parseChecklist(viewingInspection.checklist)).map(([item, entry]) => (
                  <View key={item} style={styles.viewChecklistRow}>
                    <Text style={styles.checklistItem}>{item}</Text>
                    <Text style={styles.viewChecklistState}>{entry.estado}</Text>
                    {entry.observacao ? <Text style={styles.detail}>{entry.observacao}</Text> : null}
                  </View>
                ))}

                {viewingInspection.generalNotes ? (
                  <>
                    <Text style={[styles.label, { marginTop: 16 }]}>Observações gerais</Text>
                    <Text style={styles.detail}>{viewingInspection.generalNotes}</Text>
                  </>
                ) : null}

                {viewingInspection.photos.length > 0 && (
                  <>
                    <Text style={[styles.label, { marginTop: 16 }]}>Fotos</Text>
                    <View style={styles.photoGrid}>
                      {viewingInspection.photos.map((photo) => (
                        <Image
                          key={photo.id}
                          source={{ uri: `${API_URL}/uploads/inspections/${photo.filename}` }}
                          style={styles.photoThumbLarge}
                        />
                      ))}
                    </View>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  alertCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, marginBottom: 8 },
  alertText: { fontSize: 12, color: "#334155", flex: 1 },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  plate: { fontSize: 15, fontWeight: "bold", color: "#0f172a" },
  detail: { fontSize: 12, color: "#64748b", marginTop: 2 },
  fab: {
    position: "absolute", right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#4f46e5", alignItems: "center", justifyContent: "center",
    shadowColor: "#4f46e5", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.4)" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  label: { fontSize: 13, fontWeight: "600", color: "#334155", marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  inputSmall: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, marginTop: 6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chipRowSmall: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  chipSmall: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: "#e2e8f0" },
  chipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  chipText: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  chipTextSmall: { fontSize: 11, color: "#64748b", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  checklistRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  checklistItem: { fontSize: 13, fontWeight: "600", color: "#0f172a" },
  viewChecklistRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  viewChecklistState: { fontSize: 12, color: "#4f46e5", fontWeight: "600", marginTop: 2 },
  photoButton: {
    flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#4f46e5",
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, alignSelf: "flex-start",
  },
  photoButtonText: { color: "#4f46e5", fontWeight: "600", fontSize: 13 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  photoThumbWrapper: { position: "relative" },
  photoThumb: { width: 70, height: 70, borderRadius: 8 },
  photoThumbLarge: { width: 100, height: 100, borderRadius: 10 },
  photoRemove: {
    position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#dc2626", alignItems: "center", justifyContent: "center",
  },
  saveButton: { backgroundColor: "#4f46e5", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 20, marginBottom: 20 },
  saveButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});