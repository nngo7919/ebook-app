// ============================================================
// app/auth/login.tsx — Màn hình đăng nhập
// ============================================================

import { useAuth } from "@/app/lib/auth";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInAnonymously, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  // Track xem có đang chờ navigate sau login không
  const waitingForNav = useRef(false);

  useEffect(() => {
    if (user && waitingForNav.current) {
      waitingForNav.current = false;
      router.replace("/(tabs)");
    }
  }, [user]);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập email và mật khẩu.");
      return;
    }
    setLoading(true);
    waitingForNav.current = true;
    const { error } = await signIn({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      waitingForNav.current = false;
      Alert.alert("Đăng nhập thất bại", error);
    }
  }

  async function handleGuestLogin() {
    setGuestLoading(true);
    waitingForNav.current = true;
    const { error } = await signInAnonymously();
    setGuestLoading(false);
    if (error) {
      waitingForNav.current = false;
      Alert.alert("Không thể vào chế độ khách", error);
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.inner}
      >
        {/* Logo */}
        <View style={s.logoWrap}>
          <Text style={s.logoText}>TYT</Text>
          <Text style={s.logoSub}>Đọc truyện mọi lúc, mọi nơi</Text>
        </View>

        {/* Form */}
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
          />

          <Text style={s.label}>Mật khẩu</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#555"
            secureTextEntry
          />

          <TouchableOpacity
            style={s.forgotBtn}
            onPress={() => router.push("/auth/forgot-password" as any)}
          >
            <Text style={s.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading || guestLoading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>hoặc</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Guest mode */}
          <TouchableOpacity
            style={[s.guestBtn, guestLoading && s.btnDisabled]}
            onPress={handleGuestLogin}
            disabled={loading || guestLoading}
          >
            {guestLoading ? (
              <ActivityIndicator color={PINK} />
            ) : (
              <Text style={s.guestBtnText}>Tiếp tục với tư cách khách</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/signup")}>
            <Text style={s.footerLink}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0d0d0d" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },

  logoWrap: { alignItems: "center", marginBottom: 48 },
  logoText: { color: PINK, fontSize: 48, fontWeight: "900", letterSpacing: 4 },
  logoSub: { color: "#555", fontSize: 13, marginTop: 4 },

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

  forgotBtn: { alignSelf: "flex-end", marginTop: 6, marginBottom: 4 },
  forgotText: { color: "#888", fontSize: 13 },

  btn: {
    backgroundColor: PINK,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  footerText: { color: "#555", fontSize: 14 },
  footerLink: { color: PINK, fontSize: 14, fontWeight: "600" },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#222" },
  dividerText: { color: "#555", fontSize: 13 },

  guestBtn: {
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    marginTop: 4,
  },
  guestBtnText: { color: "#aaa", fontSize: 15, fontWeight: "600" },
});