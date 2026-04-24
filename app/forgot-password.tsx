// ============================================================
// app/auth/forgot-password.tsx — Quên mật khẩu
// ============================================================

import { auth } from "@/app/lib/api";
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
		const trimmed = email.trim();
		if (!trimmed) {
			Alert.alert("Thiếu thông tin", "Vui lòng nhập địa chỉ email.");
			return;
		}

		setLoading(true);
		const { error } = await auth.resetPassword(trimmed);
		setLoading(false);

		if (error) {
			Alert.alert("Không thể gửi email", error);
			return;
		}

		setSent(true);
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

				{/* Title */}
				<View style={s.titleWrap}>
					<Text style={s.title}>Quên mật khẩu?</Text>
					<Text style={s.sub}>
						{sent
							? "Kiểm tra hộp thư của bạn."
							: "Nhập email để nhận link đặt lại mật khẩu."}
					</Text>
				</View>

				{!sent ? (
					<>
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
							editable={!loading}
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
					</>
				) : (
					<View style={s.successBox}>
						<Text style={s.successIcon}>📬</Text>
						<Text style={s.successTitle}>Email đã được gửi!</Text>
						<Text style={s.successMsg}>
							Chúng tôi đã gửi link đặt lại mật khẩu đến{"\n"}
							<Text style={s.successEmail}>{email.trim()}</Text>
						</Text>
						<Text style={s.successHint}>
							Không thấy email? Kiểm tra thư mục Spam.
						</Text>

						<TouchableOpacity
							style={s.btn}
							onPress={() => router.replace("/auth/login")}
						>
							<Text style={s.btnText}>Về trang đăng nhập</Text>
						</TouchableOpacity>

						<TouchableOpacity style={s.resendBtn} onPress={() => setSent(false)}>
							<Text style={s.resendText}>Gửi lại email</Text>
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

	titleWrap: { marginBottom: 32 },
	title: { color: "#fff", fontSize: 28, fontWeight: "800" },
	sub: { color: "#555", fontSize: 14, marginTop: 6 },

	label: { color: "#aaa", fontSize: 13, marginBottom: 8 },
	input: {
		backgroundColor: "#161616",
		borderRadius: 10,
		paddingHorizontal: 16,
		paddingVertical: 14,
		color: "#fff",
		fontSize: 16,
		borderWidth: 1,
		borderColor: "#222",
		marginBottom: 24,
	},

	btn: {
		backgroundColor: PINK,
		borderRadius: 10,
		paddingVertical: 16,
		alignItems: "center",
	},
	btnDisabled: { opacity: 0.6 },
	btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

	// Success state
	successBox: { alignItems: "center", gap: 12 },
	successIcon: { fontSize: 48, marginBottom: 8 },
	successTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
	successMsg: { color: "#aaa", fontSize: 14, textAlign: "center", lineHeight: 22 },
	successEmail: { color: PINK, fontWeight: "600" },
	successHint: { color: "#444", fontSize: 12, marginBottom: 8 },

	resendBtn: { marginTop: 4, paddingVertical: 8 },
	resendText: { color: "#555", fontSize: 14, textDecoration: "underline" } as any,
});