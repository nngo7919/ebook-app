// ============================================================
// app/author/[id].tsx — Trang tác giả
// ============================================================

import { authors as authorsApi, follows } from "@/app/lib/api";
import { useAuth } from "@/app/lib/auth";
import type { Author, Book } from "@/app/lib/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	FlatList,
	Image,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

const PINK = "#e91e8c";
const BOOK_W = 100;

// Fake author data khi chưa có DB
const FAKE_AUTHOR: Author = {
	id: "fake-author-1",
	name: "tntytn",
	bio: "Tác giả chuyên viết truyện ngôn tình, hiện đại, xuyên thư. Đã xuất bản hơn 20 tác phẩm với tổng lượt đọc hàng triệu lượt.",
	avatar_url: null,
	verified: true,
	follower_count: 3842,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	is_followed: false,
};

function formatCount(n: number) {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return String(n);
}

export default function AuthorScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { user } = useAuth();

	const [author, setAuthor] = useState<Author | null>(null);
	const [books, setBooks] = useState<Book[]>([]);
	const [loading, setLoading] = useState(true);
	const [followed, setFollowed] = useState(false);

	useEffect(() => {
		fetchData();
	}, [id]);

	async function fetchData() {
		setLoading(true);

		const { data: authorData } = await authorsApi.get(id, user?.id);
		if (authorData) {
			setAuthor(authorData);
			setFollowed(authorData.is_followed ?? false);
		} else {
			setAuthor({ ...FAKE_AUTHOR, id });
		}

		const { data: booksData } = await authorsApi.getBooks(id, { limit: 20 });
		setBooks(booksData ?? []);

		setLoading(false);
	}

	async function handleToggleFollow() {
		if (!user) {
			router.push("/auth/login");
			return;
		}
		const { data: newState } = await follows.toggle(user.id, id);
		if (newState !== null) {
			setFollowed(newState);
			setAuthor((prev) =>
				prev
					? {
						...prev,
						follower_count: prev.follower_count + (newState ? 1 : -1),
					}
					: prev
			);
		}
	}

	if (loading) {
		return (
			<SafeAreaView style={s.container}>
				<View style={s.center}>
					<Text style={s.loadingText}>Đang tải...</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (!author) return null;

	const avatarLetter = author.name.charAt(0).toUpperCase();

	return (
		<SafeAreaView style={s.container}>
			{/* Header */}
			<View style={s.header}>
				<TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
					<Text style={s.headerBack}>←</Text>
				</TouchableOpacity>
				<Text style={s.headerTitle} numberOfLines={1}>
					{author.name}
				</Text>
				<View style={{ width: 36 }} />
			</View>

			<ScrollView showsVerticalScrollIndicator={false}>
				{/* Author info */}
				<View style={s.profileSection}>
					{/* Avatar */}
					<View style={s.avatarWrap}>
						{author.avatar_url ? (
							<Image source={{ uri: author.avatar_url }} style={s.avatar} />
						) : (
							<View style={[s.avatar, s.avatarPlaceholder]}>
								<Text style={s.avatarLetter}>{avatarLetter}</Text>
							</View>
						)}
						{author.verified && (
							<View style={s.verifiedBadge}>
								<Text style={s.verifiedText}>✓</Text>
							</View>
						)}
					</View>

					{/* Name + stats */}
					<Text style={s.authorName}>{author.name}</Text>

					<View style={s.statsRow}>
						<View style={s.statItem}>
							<Text style={s.statValue}>{formatCount(author.follower_count)}</Text>
							<Text style={s.statLabel}>Người theo dõi</Text>
						</View>
						<View style={s.statDivider} />
						<View style={s.statItem}>
							<Text style={s.statValue}>{books.length}</Text>
							<Text style={s.statLabel}>Tác phẩm</Text>
						</View>
					</View>

					{/* Bio */}
					{author.bio ? (
						<Text style={s.bio}>{author.bio}</Text>
					) : null}

					{/* Follow button */}
					<TouchableOpacity
						style={[s.followBtn, followed && s.followBtnActive]}
						onPress={handleToggleFollow}
					>
						<Text style={[s.followBtnText, followed && s.followBtnTextActive]}>
							{followed ? "✓ Đang theo dõi" : "+ Theo dõi"}
						</Text>
					</TouchableOpacity>
				</View>

				{/* Books */}
				<View style={s.booksSection}>
					<Text style={s.sectionTitle}>Tác phẩm</Text>

					{books.length === 0 ? (
						<Text style={s.emptyText}>Chưa có tác phẩm nào</Text>
					) : (
						<FlatList
							data={books}
							keyExtractor={(item) => item.id}
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={s.bookList}
							renderItem={({ item }) => (
								<TouchableOpacity
									style={s.bookCard}
									onPress={() =>
										router.push({
											pathname: "/book/[id]",
											params: { id: item.id },
										})
									}
								>
									<View style={s.bookCover}>
										{item.cover_url ? (
											<Image
												source={{ uri: item.cover_url }}
												style={s.coverImage}
											/>
										) : (
											<View style={s.coverPlaceholder}>
												<Text style={{ fontSize: 28 }}>
													{item.tag === "novel" ? "📖" : "📚"}
												</Text>
											</View>
										)}
										{item.is_full && (
											<View style={s.fullBadge}>
												<Text style={s.fullBadgeText}>FULL</Text>
											</View>
										)}
									</View>
									<Text style={s.bookTitle} numberOfLines={2}>
										{item.title}
									</Text>
									<Text style={s.bookChapters}>
										{item.total_chapters} chương
									</Text>
								</TouchableOpacity>
							)}
						/>
					)}
				</View>

				<View style={{ height: 40 }} />
			</ScrollView>
		</SafeAreaView>
	);
}

const s = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#0d0d0d" },
	center: { flex: 1, alignItems: "center", justifyContent: "center" },
	loadingText: { color: "#888" },

	// Header
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 8,
		paddingVertical: 12,
	},
	headerBtn: {
		width: 36,
		height: 36,
		alignItems: "center",
		justifyContent: "center",
	},
	headerBack: { color: PINK, fontSize: 22, fontWeight: "bold" },
	headerTitle: {
		flex: 1,
		color: "#fff",
		fontSize: 17,
		fontWeight: "bold",
		textAlign: "center",
	},

	// Profile
	profileSection: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 24 },

	avatarWrap: { position: "relative", marginBottom: 16 },
	avatar: { width: 96, height: 96, borderRadius: 48 },
	avatarPlaceholder: {
		backgroundColor: PINK,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarLetter: { color: "#fff", fontSize: 38, fontWeight: "800" },
	verifiedBadge: {
		position: "absolute",
		bottom: 2,
		right: 2,
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: "#3498db",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: "#0d0d0d",
	},
	verifiedText: { color: "#fff", fontSize: 12, fontWeight: "bold" },

	authorName: {
		color: "#fff",
		fontSize: 22,
		fontWeight: "800",
		marginBottom: 16,
		textAlign: "center",
	},

	statsRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
		gap: 32,
	},
	statItem: { alignItems: "center" },
	statValue: { color: "#fff", fontSize: 20, fontWeight: "700" },
	statLabel: { color: "#888", fontSize: 12, marginTop: 2 },
	statDivider: { width: 1, height: 32, backgroundColor: "#222" },

	bio: {
		color: "#aaa",
		fontSize: 14,
		lineHeight: 22,
		textAlign: "center",
		marginBottom: 20,
	},

	followBtn: {
		borderWidth: 1.5,
		borderColor: PINK,
		borderRadius: 24,
		paddingVertical: 10,
		paddingHorizontal: 36,
	},
	followBtnActive: { backgroundColor: PINK },
	followBtnText: { color: PINK, fontSize: 15, fontWeight: "600" },
	followBtnTextActive: { color: "#fff" },

	// Books section
	booksSection: { paddingBottom: 8 },
	sectionTitle: {
		color: "#fff",
		fontSize: 17,
		fontWeight: "bold",
		paddingHorizontal: 16,
		marginBottom: 12,
	},
	emptyText: { color: "#555", fontSize: 14, paddingHorizontal: 16 },
	bookList: { paddingHorizontal: 16, gap: 12 },
	bookCard: { width: BOOK_W },
	bookCover: {
		width: BOOK_W,
		height: BOOK_W * 1.4,
		borderRadius: 8,
		overflow: "hidden",
		marginBottom: 6,
		position: "relative",
	},
	coverImage: { width: "100%", height: "100%", resizeMode: "cover" },
	coverPlaceholder: {
		width: "100%",
		height: "100%",
		backgroundColor: "#1e1e1e",
		alignItems: "center",
		justifyContent: "center",
	},
	fullBadge: {
		position: "absolute",
		top: 0,
		right: 0,
		backgroundColor: "#2ecc71",
		paddingHorizontal: 5,
		paddingVertical: 2,
		borderBottomLeftRadius: 6,
	},
	fullBadgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
	bookTitle: { color: "#ccc", fontSize: 12, lineHeight: 16 },
	bookChapters: { color: "#666", fontSize: 11, marginTop: 2 },
});