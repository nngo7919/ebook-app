// ============================================================
// app/auth/signup.tsx — Màn hình đăng ký
// ============================================================

import { useAuth } from "@/app/lib/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PINK = "#e91e8c";

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, signOut } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ các trường.");
      return;
    }
    if (password !== confirm) {
      Alert.alert(
        "Mật khẩu không khớp",
        "Vui lòng kiểm tra lại mật khẩu xác nhận.",
      );
      return;
    }
    if (password.length < 6) {
      Alert.alert("Mật khẩu quá ngắn", "Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    const { error, requiresConfirmation } = await signUp({
      email: email.trim(),
      password,
      username: username.trim(),
    });
    setLoading(false);

    if (error) {
      Alert.alert("Đăng ký thất bại", error);
      return;
    }

    if (requiresConfirmation) {
      // Confirm email = ON → session chưa tạo, chỉ cần báo user kiểm tra email
      Alert.alert(
        "Kiểm tra email của bạn 📬",
        `Chúng tôi đã gửi link xác nhận đến ${email.trim()}. Sau khi xác nhận hãy đăng nhập.`,
        [{ text: "Đăng nhập", onPress: () => router.replace("/auth/login") }],
      );
    } else {
      // Confirm email = OFF → Supabase tạo session luôn, cần sign out
      // trước khi alert để tránh AuthProvider tự redirect sang tabs
      await signOut();
      Alert.alert(
        "Đăng ký thành công! 🎉",
        "Tài khoản đã được tạo. Bạn có thể đăng nhập ngay bây giờ.",
        [{ text: "Đăng nhập", onPress: () => router.replace("/auth/login") }],
      );
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backText}>← Quay lại</Text>
          </TouchableOpacity>

          <View style={s.titleWrap}>
            <Text style={s.title}>Tạo tài khoản</Text>
            <Text style={s.sub}>Tham gia cộng đồng đọc truyện TYT</Text>
          </View>

          {/* Form */}
          <View style={s.form}>
            <Text style={s.label}>Tên người dùng</Text>
            <TextInput
              style={s.input}
              value={username}
              onChangeText={setUsername}
              placeholder="ngomanhduc123"
              placeholderTextColor="#555"
              autoCapitalize="none"
              autoCorrect={false}
            />

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
            />

            <Text style={s.label}>Mật khẩu</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Ít nhất 6 ký tự"
              placeholderTextColor="#555"
              secureTextEntry
            />

            <Text style={s.label}>Xác nhận mật khẩu</Text>
            <TextInput
              style={s.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Nhập lại mật khẩu"
              placeholderTextColor="#555"
              secureTextEntry
            />

            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.btnText}>Đăng ký</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.replace("/auth/login")}>
              <Text style={s.footerLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0d0d0d" },
  inner: { paddingHorizontal: 28, paddingBottom: 48, paddingTop: 16 },

  backBtn: { marginBottom: 24 },
  backText: { color: PINK, fontSize: 15 },

  titleWrap: { marginBottom: 32 },
  title: { color: "#fff", fontSize: 28, fontWeight: "800" },
  sub: { color: "#555", fontSize: 14, marginTop: 6 },

  form: { gap: 8 },
  label: { color: "#aaa", fontSize: 13, marginTop: 12, marginBottom: 4 },
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

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
  footerText: { color: "#555", fontSize: 14 },
  footerLink: { color: PINK, fontSize: 14, fontWeight: "600" },
});