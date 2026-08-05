import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch {
      setError("Email ou senha inválidos");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>FA</Text>
      </View>
      <Text style={styles.title}>Fleet Admin</Text>
      <Text style={styles.subtitle}>Entre com sua conta para continuar</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", justifyContent: "center", padding: 24 },
  logo: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#4f46e5", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16 },
  logoText: { color: "#fff", fontWeight: "bold", fontSize: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#0f172a", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#64748b", textAlign: "center", marginTop: 4, marginBottom: 32 },
  form: { backgroundColor: "#fff", borderRadius: 16, padding: 20, gap: 4, borderWidth: 1, borderColor: "#e2e8f0" },
  label: { fontSize: 13, fontWeight: "500", color: "#334155", marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  error: { color: "#dc2626", fontSize: 13, marginTop: 8 },
  button: { backgroundColor: "#4f46e5", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 16 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});