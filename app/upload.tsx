// ============================================================
// app/upload.tsx — Trang đăng truyện
// ============================================================

import { books as booksApi, library as libApi } from "@/app/lib/api";
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

const GENRE_OPTIONS = [
	"Tiên Hiệp", "Huyền Huyễn", "Kiếm Hiệp", "Võng Du",
	"Đô Thị", "Dị Năng", "Lịch Sử", "Quân Sự",
	"Ngôn Tình", "Cổ Đại", "Niên Đại", "Điền Văn",
	"Kinh Dị", "Hài Hước", "Xuyên Thư", "Mạt Thế",
	"HE", "BE", "Sủng Văn", "Đam Mỹ",
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
	return (
		<View style={s.field}>
			<Text style={s.fieldLabel}>
				{label}{required && <Text style={{ color: PINK }}> *</Text>}
			</Text>
			{children}
		</View>
	);
}

export default function UploadScreen() {
	const router = useRouter();
	const { user, isGuest } = useAuth();

	const [title, setTitle] = useState("");
	const [author, setAuthor] = useState("");
	const [description, setDescription] = useState("");
	const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
	const [tag, setTag] = useState<"novel" | "book">("novel");
	const [isFull, setIsFull] = useState(false);
	const [loading, setLoading] = useState(false);

	function toggleGenre(g: string) {
		setSelectedGenres((prev) =>
			prev.includes(g) ? prev.filter((x) => x !== g) : prev.length < 5 ? [...prev, g] : prev,
		);
	}

	async function handleSubmit() {
		if (!user || isGuest) {
			Alert.alert("Cần đăng nhập", "Vui lòng đăng nhập để đăng truyện.");
			return;
		}
		if (!title.trim()) {
			Alert.alert("Thiếu thông tin", "Vui lòng nhập tên truyện.");
			return;
		}
		if (!author.trim()) {
			Alert.alert("Thiếu thông tin", "Vui lòng nhập tên tác giả.");
			return;
		}
		if (selectedGenres.length === 0) {
			Alert.alert("Thiếu thông tin", "Chọn ít nhất 1 thể loại.");
			return;
		}

		setLoading(true);

		// Tạo book record
		const { data: book, error } = await booksApi.create({
			title: title.trim(),
			author: author.trim(),
			description: description.trim() || null,
			genres: selectedGenres.join(", "),
			tag,
			is_full: isFull,
			total_chapters: 0,
			is_public: true,
			uploader_id: user.id,
		});

		if (error || !book) {
			setLoading(false);
			Alert.alert("Lỗi", error ?? "Không thể đăng truyện. Thử lại sau.");
			return;
		}

		// Lưu vào library của user
		await libApi.add(user.id, {
			book_id: book.id,
			title: book.title,
			author: author.trim(),
			tag,
			source: "upload",
		});

		setLoading(false);
		Alert.alert("✅ Đăng thành công!", `"${title}" đã được đăng lên.`, [
			{
				text: "Xem truyện",
				onPress: () => router.replace({ pathname: "/book/[id]", params: { id: book.id } }),
			},
			{
				text: "Đăng thêm",
				onPress: () => {
					setTitle(""); setAuthor(""); setDescription("");
					setSelectedGenres([]); setIsFull(false);
				},
			},
		]);
	}

	return (
		<SafeAreaView style={s.root}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={{ flex: 1 }}
			>
				{/* Header */}
				<View style={s.header}>
					<TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
						<Text style={s.backText}>←</Text>
					</TouchableOpacity>
					<Text style={s.headerTitle}>Đăng Truyện</Text>
					<View style={{ width: 36 }} />
				</View>

				<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
					{/* Tên truyện */}
					<Field label="Tên truyện" required>
						<TextInput
							style={s.input}
							value={title}
							onChangeText={setTitle}
							placeholder="Nhập tên truyện..."
							placeholderTextColor="#555"
							maxLength={100}
						/>
					</Field>

					{/* Tác giả */}
					<Field label="Tên tác giả" required>
						<TextInput
							style={s.input}
							value={author}
							onChangeText={setAuthor}
							placeholder="Bút danh của bạn..."
							placeholderTextColor="#555"
							maxLength={60}
						/>
					</Field>

					{/* Mô tả */}
					<Field label="Giới thiệu truyện">
						<TextInput
							style={[s.input, s.inputMulti]}
							value={description}
							onChangeText={setDescription}
							placeholder="Giới thiệu nội dung truyện..."
							placeholderTextColor="#555"
							multiline
							maxLength={1000}
							textAlignVertical="top"
						/>
						<Text style={s.charCount}>{description.length}/1000</Text>
					</Field>

					{/* Loại */}
					<Field label="Loại">
						<View style={s.toggleRow}>
							{(["novel", "book"] as const).map((t) => (
								<TouchableOpacity
									key={t}
									style={[s.toggleBtn, tag === t && s.toggleBtnActive]}
									onPress={() => setTag(t)}
								>
									<Text style={[s.toggleText, tag === t && s.toggleTextActive]}>
										{t === "novel" ? "📖 Truyện chữ" : "📚 Sách"}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</Field>

					{/* Trạng thái */}
					<Field label="Trạng thái">
						<View style={s.toggleRow}>
							{[false, true].map((full) => (
								<TouchableOpacity
									key={String(full)}
									style={[s.toggleBtn, isFull === full && s.toggleBtnActive]}
									onPress={() => setIsFull(full)}
								>
									<Text style={[s.toggleText, isFull === full && s.toggleTextActive]}>
										{full ? "✅ Đã hoàn" : "🔄 Đang ra"}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</Field>

					{/* Thể loại */}
					<Field label={`Thể loại (chọn tối đa 5, đã chọn ${selectedGenres.length})`} required>
						<View style={s.genreWrap}>
							{GENRE_OPTIONS.map((g) => {
								const active = selectedGenres.includes(g);
								return (
									<TouchableOpacity
										key={g}
										style={[s.genreChip, active && s.genreChipActive]}
										onPress={() => toggleGenre(g)}
									>
										<Text style={[s.genreText, active && s.genreTextActive]}>{g}</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					</Field>

					{/* Submit */}
					<TouchableOpacity
						style={[s.submitBtn, loading && { opacity: 0.6 }]}
						onPress={handleSubmit}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={s.submitText}>Đăng Truyện</Text>
						)}
					</TouchableOpacity>

					<View style={{ height: 40 }} />
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const s = StyleSheet.create({
	root: { flex: 1, backgroundColor: "#0d0d0d" },

	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 0.5,
		borderBottomColor: "#1a1a1a",
	},
	backBtn: { width: 36, alignItems: "flex-start" },
	backText: { color: PINK, fontSize: 22 },
	headerTitle: { flex: 1, color: "#fff", fontSize: 17, fontWeight: "700", textAlign: "center" },

	body: { paddingHorizontal: 20, paddingTop: 20 },

	field: { marginBottom: 24 },
	fieldLabel: { color: "#aaa", fontSize: 13, marginBottom: 8 },

	input: {
		backgroundColor: "#161616",
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#222",
		color: "#fff",
		fontSize: 15,
		paddingHorizontal: 14,
		paddingVertical: 13,
	},
	inputMulti: { minHeight: 100, paddingTop: 13 },
	charCount: { color: "#444", fontSize: 12, textAlign: "right", marginTop: 4 },

	toggleRow: { flexDirection: "row", gap: 10 },
	toggleBtn: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#222",
		alignItems: "center",
		backgroundColor: "#161616",
	},
	toggleBtnActive: { borderColor: PINK, backgroundColor: "#2a0a1a" },
	toggleText: { color: "#666", fontSize: 14 },
	toggleTextActive: { color: PINK, fontWeight: "700" },

	genreWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	genreChip: {
		paddingHorizontal: 12,
		paddingVertical: 7,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: "#2a2a2a",
		backgroundColor: "#161616",
	},
	genreChipActive: { borderColor: PINK, backgroundColor: "#2a0a1a" },
	genreText: { color: "#777", fontSize: 13 },
	genreTextActive: { color: PINK, fontWeight: "600" },

	submitBtn: {
		backgroundColor: PINK,
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: "center",
		marginTop: 8,
	},
	submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});