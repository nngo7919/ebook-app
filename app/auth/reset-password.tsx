// ============================================================
// app/auth/reset-password.tsx — Màn hình đặt lại mật khẩu
// Flow:
//   1. User bấm link email → deep link ebook-app://auth/reset-password#access_token=...
//   2. _layout.tsx bắt link, gọi supabase.setSession() rồi navigate đến đây
//   3. Session đã sẵn sàng khi màn hình mount → updateUser() ghi mật khẩu mới
// ============================================================

import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
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

export default function ResetPasswordScreen() {
	const router = useRouter();
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [loading, setLoading] = useState(false);
	const [done, setDone] = useState(false);
	const confirmRef = useRef<TextInput>(null);

	async function handleReset() {
		if (!password.trim()) {
			Alert.alert("Thiếu thông tin", "Vui lòng nhập mật khẩu mới.");
			return;
		}
		if (password.length < 6) {
			Alert.alert("Mật khẩu quá ngắn", "Mật khẩu phải có ít nhất 6 ký tự.");
			return;
		}
		if (password !== confirm) {
			Alert.alert("Không khớp", "Mật khẩu nhập lại không khớp.");
			return;
		}

		// Kiểm tra session trước khi gọi updateUser
		const { data: sessionData } = await supabase.auth.getSession();
		if (!sessionData.session) {
			Alert.alert(
				"Link đã hết hạn",
				"Link đặt lại mật khẩu đã hết hạn hoặc đã dùng rồi. Vui lòng gửi lại email.",
				[
					{ text: "Để sau", style: "cancel" },
					{ text: "Gửi lại", onPress: () => router.replace("/auth/forgot-password") },
				],
			);
			return;
		}

		setLoading(true);
		// Gọi trực tiếp supabase.auth.updateUser thay vì qua api wrapper
		// để đảm bảo dùng đúng session hiện tại
		const { error } = await supabase.auth.updateUser({ password });
		setLoading(false);

		if (error) {
			Alert.alert("Lỗi", error.message ?? "Không thể đặt lại mật khẩu. Thử lại sau.");
		} else {
			// Đăng xuất sau khi đổi xong để user đăng nhập lại với mật khẩu mới
			await supabase.auth.signOut();
			setDone(true);
		}
	}

	// Đặt lại thành công
	if (done) {
		return (
			<SafeAreaView style={s.root}>
				<View style={s.successWrap}>
					<Text style={s.successIcon}>🔐</Text>
					<Text style={s.successTitle}>Đặt lại thành công!</Text>
					<Text style={s.successSub}>
						Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại.
					</Text>
					<TouchableOpacity
						style={s.btn}
						onPress={() => router.replace("/auth/login")}
					>
						<Text style={s.btnText}>Về đăng nhập</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={s.root}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={s.inner}
			>
				{/* Header */}
				<View style={s.titleWrap}>
					<Text style={s.title}>Đặt lại mật khẩu</Text>
					<Text style={s.sub}>Nhập mật khẩu mới cho tài khoản của bạn.</Text>
				</View>

				<View style={s.form}>
					{/* Mật khẩu mới */}
					<Text style={s.label}>Mật khẩu mới</Text>
					<TextInput
						style={s.input}
						value={password}
						onChangeText={setPassword}
						placeholder="Ít nhất 6 ký tự"
						placeholderTextColor="#555"
						secureTextEntry
						autoFocus
						returnKeyType="next"
						onSubmitEditing={() => confirmRef.current?.focus()}
					/>

					{/* Nhập lại */}
					<Text style={[s.label, { marginTop: 16 }]}>Nhập lại mật khẩu</Text>
					<TextInput
						ref={confirmRef}
						style={[
							s.input,
							confirm.length > 0 && password !== confirm && s.inputError,
						]}
						value={confirm}
						onChangeText={setConfirm}
						placeholder="Nhập lại mật khẩu mới"
						placeholderTextColor="#555"
						secureTextEntry
						returnKeyType="done"
						onSubmitEditing={handleReset}
					/>
					{confirm.length > 0 && password !== confirm && (
						<Text style={s.errorText}>Mật khẩu không khớp</Text>
					)}

					{/* Nút xác nhận */}
					<TouchableOpacity
						style={[s.btn, (loading || !password || password !== confirm) && s.btnDisabled]}
						onPress={handleReset}
						disabled={loading || !password || password !== confirm}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={s.btnText}>Xác nhận đặt lại</Text>
						)}
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const s = StyleSheet.create({
	root: { flex: 1, backgroundColor: "#0d0d0d" },
	inner: { flex: 1, paddingHorizontal: 28, paddingTop: 48 },

	titleWrap: { marginBottom: 36 },
	title: { color: "#fff", fontSize: 28, fontWeight: "800" },
	sub: { color: "#888", fontSize: 14, marginTop: 8, lineHeight: 22 },

	form: { gap: 4 },
	label: { color: "#aaa", fontSize: 13, marginBottom: 6 },
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
	inputError: { borderColor: "#e74c3c" },
	errorText: { color: "#e74c3c", fontSize: 12, marginTop: 4 },

	btn: {
		backgroundColor: PINK,
		borderRadius: 10,
		paddingVertical: 16,
		alignItems: "center",
		marginTop: 28,
	},
	btnDisabled: { opacity: 0.45 },
	btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

	// Success state
	successWrap: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
		gap: 12,
	},
	successIcon: { fontSize: 60 },
	successTitle: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 8 },
	successSub: {
		color: "#888",
		fontSize: 15,
		textAlign: "center",
		lineHeight: 24,
	},
});