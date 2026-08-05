import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BarChart } from "react-native-gifted-charts";
import { api } from "../../api/client";

interface Vehicle { id: number; status: string; }
interface Driver { id: number; status: string; }
interface FinancialEntry { id: number; direction: string; amount: string; status: string; dueAt: string; }

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const [vehRes, drvRes, entRes] = await Promise.all([
      api.get("/vehicles"),
      api.get("/drivers"),
      api.get("/financial-entries"),
    ]);
    setVehicles(vehRes.data);
    setDrivers(drvRes.data);
    setEntries(entRes.data);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const availableVehicles = vehicles.filter((v) => v.status === "available").length;
  const rentedVehicles = vehicles.filter((v) => v.status === "rented").length;
  const occupancyRate = vehicles.length > 0 ? Math.round((rentedVehicles / vehicles.length) * 100) : 0;
  const activeDrivers = drivers.filter((d) => d.status === "active").length;

  const totalIn = entries.filter((e) => e.direction === "in" && e.status !== "pending").reduce((s, e) => s + Number(e.amount), 0);
  const totalOut = entries.filter((e) => e.direction === "out" && e.status !== "pending").reduce((s, e) => s + Number(e.amount), 0);
  const totalPending = entries.filter((e) => e.status === "pending").reduce((s, e) => s + Number(e.amount), 0);
  const cashBalance = totalIn - totalOut;

  const monthlyMap = new Map<string, { in: number; out: number }>();
  for (const entry of entries) {
    const date = new Date(entry.dueAt);
    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
    if (!monthlyMap.has(key)) monthlyMap.set(key, { in: 0, out: 0 });
    const bucket = monthlyMap.get(key)!;
    if (entry.direction === "in") bucket.in += Number(entry.amount);
    else bucket.out += Number(entry.amount);
  }

  const sortedMonths = Array.from(monthlyMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  const chartData = sortedMonths.flatMap(([key, values]) => {
    const [, month] = key.split("-");
    const label = monthNames[Number(month)];
    return [
      { value: values.in, label, frontColor: "#16a34a", spacing: 2 },
      { value: values.out, frontColor: "#dc2626" },
    ];
  });

  const screenWidth = Dimensions.get("window").width;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
    >
      <View style={styles.row}>
        <View style={[styles.card, styles.halfCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Veículos</Text>
            <View style={styles.iconBadge}>
              <Ionicons name="car-outline" size={16} color="#4f46e5" />
            </View>
          </View>
          <Text style={styles.cardValue}>{vehicles.length}</Text>
          <View style={styles.pillRow}>
            <View style={[styles.pill, { backgroundColor: "#d1fae5" }]}>
              <Text style={[styles.pillText, { color: "#059669" }]}>{availableVehicles} livres</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: "#dbeafe" }]}>
              <Text style={[styles.pillText, { color: "#2563eb" }]}>{rentedVehicles} alugados</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.halfCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Motoristas</Text>
            <View style={styles.iconBadge}>
              <Ionicons name="people-outline" size={16} color="#4f46e5" />
            </View>
          </View>
          <Text style={styles.cardValue}>{drivers.length}</Text>
          <View style={styles.pillRow}>
            <View style={[styles.pill, { backgroundColor: "#d1fae5" }]}>
              <Text style={[styles.pillText, { color: "#059669" }]}>{activeDrivers} ativos</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>Ocupação da frota</Text>
          <View style={styles.iconBadge}>
            <Ionicons name="trending-up-outline" size={16} color="#4f46e5" />
          </View>
        </View>
        <Text style={styles.cardValue}>{occupancyRate}%</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${occupancyRate}%` }]} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>Saldo em caixa</Text>
          <View style={styles.iconBadge}>
            <Ionicons name="wallet-outline" size={16} color="#4f46e5" />
          </View>
        </View>
        <Text style={[styles.cardValue, { color: cashBalance >= 0 ? "#059669" : "#dc2626" }]}>
          R$ {cashBalance.toFixed(2)}
        </Text>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Recebido</Text>
          <Text style={[styles.detailValue, { color: "#059669" }]}>R$ {totalIn.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Pago</Text>
          <Text style={[styles.detailValue, { color: "#dc2626" }]}>R$ {totalOut.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Pendente</Text>
          <Text style={[styles.detailValue, { color: "#d97706" }]}>R$ {totalPending.toFixed(2)}</Text>
        </View>
      </View>

      {chartData.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Entradas x Saídas por mês</Text>
          <View style={{ marginTop: 12, alignItems: "center" }}>
            <BarChart
              data={chartData}
              width={screenWidth - 80}
              height={180}
              barWidth={18}
              spacing={20}
              noOfSections={4}
              yAxisTextStyle={{ color: "#94a3b8", fontSize: 10 }}
              xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 10 }}
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor="#e2e8f0"
            />
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#16a34a" }]} />
              <Text style={styles.legendText}>Entradas</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#dc2626" }]} />
              <Text style={styles.legendText}>Saídas</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  halfCard: { flex: 1 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "#e2e8f0",
    shadowColor: "#94a3b8", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardLabel: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  cardValue: { fontSize: 28, fontWeight: "bold", color: "#0f172a" },
  iconBadge: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center" },
  pillRow: { flexDirection: "row", gap: 6, marginTop: 10 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: "600" },
  progressTrack: { height: 6, backgroundColor: "#e2e8f0", borderRadius: 999, marginTop: 10, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: "#4f46e5", borderRadius: 999 },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 10 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  detailLabel: { fontSize: 13, color: "#64748b" },
  detailValue: { fontSize: 13, fontWeight: "600" },
  legendRow: { flexDirection: "row", justifyContent: "center", gap: 20, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: "#64748b" },
});