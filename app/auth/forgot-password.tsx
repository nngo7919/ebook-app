// ============================================================
// app/auth/forgot-password.tsx — Màn hình quên mật khẩu
// ============================================================

import { auth as authApi } from "@/app/lib/api";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PINK = "#e91e8c";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!email.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập email của bạn.");
      return;
    }

    setLoading(true);
    const { error } = await authApi.resetPassword(email.trim());
    setLoading(false);

    if (error) {
      Alert.alert("Lỗi", error);
    } else {
      setSent(true);
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.inner}
      >
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Quay lại</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={s.titleWrap}>
          <Text style={s.title}>Quên mật khẩu</Text>
          <Text style={s.sub}>
            Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.
          </Text>
        </View>

        {!sent ? (
          <View style={s.form}>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#555"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />

            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled]}
              onPress={handleSend}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.btnText}>Gửi link đặt lại</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          // Màn hình sau khi gửi thành công
          <View style={s.successWrap}>
            <Text style={s.successIcon}>📬</Text>
            <Text style={s.successTitle}>Đã gửi!</Text>
            <Text style={s.successSub}>
              Kiểm tra hộp thư{" "}
              <Text style={{ color: PINK }}>{email}</Text>
              {" "}và làm theo hướng dẫn để đặt lại mật khẩu.
            </Text>
            <Text style={s.successNote}>
              Không thấy email? Kiểm tra thư mục spam.
            </Text>

            <TouchableOpacity
              style={s.btn}
              onPress={() => router.replace("/auth/login")}
            >
              <Text style={s.btnText}>Về đăng nhập</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0d0d0d" },
  inner: { flex: 1, paddingHorizontal: 28, paddingTop: 16 },

  backBtn: { marginBottom: 32 },
  backText: { color: PINK, fontSize: 15 },

  titleWrap: { marginBottom: 36 },
  title: { color: "#fff", fontSize: 28, fontWeight: "800" },
  sub: { color: "#888", fontSize: 14, marginTop: 8, lineHeight: 22 },

  form: { gap: 8 },
  label: { color: "#aaa", fontSize: 13, marginBottom: 4 },
  input: {
    backgroundColor: "#161616",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#222",
  },

  btn: {
    backgroundColor: PINK,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // Success state
  successWrap: { alignItems: "center", paddingTop: 24, gap: 12 },
  successIcon: { fontSize: 56 },
  successTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 8,
  },
  successSub: {
    color: "#888",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  successNote: {
    color: "#555",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
});