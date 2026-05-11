// ============================================================
// app/my-books.tsx — Truyện của tôi (danh sách + upload)
// ============================================================

import { library as libApi } from "@/app/lib/api";
import { useAuth } from "@/app/lib/auth";
import type { UserLibraryItem } from "@/app/lib/types";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	SafeAreaView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

const PINK = "#e91e8c";

function BookCover({ item }: { item: UserLibraryItem }) {
	const EMOJIS: Record<string, string> = {
		novel: "📖",
		book: "📚",
	};
	if (item.cover_url) return null;
	return (
		<View style={s.coverPlaceholder}>
			<Text style={{ fontSize: 28 }}>{EMOJIS[item.tag] ?? "📖"}</Text>
		</View>
	);
}

function BookRow({ item, onPress }: { item: UserLibraryItem; onPress: () => void }) {
	return (
		<TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
			<BookCover item={item} />
			<View style={s.info}>
				<Text style={s.title} numberOfLines={2}>{item.title}</Text>
				<Text style={s.author}>{item.author}</Text>
				<View style={s.tagRow}>
					<View style={s.tagChip}>
						<Text style={s.tagText}>{item.source === "upload" ? "Đã tải lên" : "Đã tải về"}</Text>
					</View>
				</View>
			</View>
			<Text style={s.arrow}>›</Text>
		</TouchableOpacity>
	);
}

export default function MyBooksScreen() {
	const router = useRouter();
	const { user, isGuest } = useAuth();
	const [books, setBooks] = useState<UserLibraryItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchBooks();
	}, []);

	async function fetchBooks() {
		if (!user || isGuest) { setLoading(false); return; }
		setLoading(true);
		const { data } = await libApi.list(user.id, { source: "upload" });
		setBooks(data ?? []);
		setLoading(false);
	}

	return (
		<SafeAreaView style={s.root}>
			{/* Header */}
			<View style={s.header}>
				<TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
					<Text style={s.backText}>←</Text>
				</TouchableOpacity>
				<Text style={s.headerTitle}>Truyện Của Tôi</Text>
				<TouchableOpacity
					style={s.uploadBtn}
					onPress={() => router.push("/upload" as any)}
				>
					<Text style={s.uploadBtnText}>+ Đăng</Text>
				</TouchableOpacity>
			</View>

			{loading ? (
				<View style={s.center}>
					<ActivityIndicator color={PINK} />
				</View>
			) : books.length === 0 ? (
				<View style={s.center}>
					<Text style={s.emptyIcon}>📝</Text>
					<Text style={s.emptyTitle}>Chưa có truyện nào</Text>
					<Text style={s.emptySub}>Bấm "+ Đăng" để đăng truyện của bạn lên.</Text>
					<TouchableOpacity
						style={s.uploadBigBtn}
						onPress={() => router.push("/upload" as any)}
					>
						<Text style={s.uploadBigBtnText}>Đăng truyện ngay</Text>
					</TouchableOpacity>
				</View>
			) : (
				<FlatList
					data={books}
					keyExtractor={(item) => item.id}
					contentContainerStyle={{ paddingBottom: 40 }}
					renderItem={({ item }) => (
						<BookRow
							item={item}
							onPress={() => {
								if (item.book_id) {
									router.push({ pathname: "/book/[id]", params: { id: item.book_id } });
								}
							}}
						/>
					)}
					ItemSeparatorComponent={() => <View style={s.sep} />}
				/>
			)}
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
	uploadBtn: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
		backgroundColor: PINK,
	},
	uploadBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

	center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
	emptyIcon: { fontSize: 52 },
	emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
	emptySub: { color: "#666", fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
	uploadBigBtn: {
		marginTop: 8,
		paddingHorizontal: 28,
		paddingVertical: 14,
		borderRadius: 12,
		backgroundColor: PINK,
	},
	uploadBigBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

	row: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 14,
		gap: 12,
	},
	coverPlaceholder: {
		width: 54,
		height: 74,
		borderRadius: 6,
		backgroundColor: "#1a1a1a",
		alignItems: "center",
		justifyContent: "center",
	},
	info: { flex: 1, gap: 4 },
	title: { color: "#fff", fontSize: 15, fontWeight: "600", lineHeight: 21 },
	author: { color: "#888", fontSize: 13 },
	tagRow: { flexDirection: "row", gap: 6, marginTop: 2 },
	tagChip: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 4,
		backgroundColor: "#1e1e1e",
		borderWidth: 0.5,
		borderColor: "#333",
	},
	tagText: { color: "#777", fontSize: 11 },
	arrow: { color: "#444", fontSize: 22 },
	sep: { height: 0.5, backgroundColor: "#1a1a1a", marginLeft: 82 },
});