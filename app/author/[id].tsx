import {
	authors as authorsApi,
	follows as followsApi,
} from "@/app/lib/api";
import { useAuth } from "@/app/lib/auth";
import type { Author, Book } from "@/app/lib/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Dimensions,
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
const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 3;

export default function AuthorScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { user, isGuest } = useAuth();

	const [author, setAuthor] = useState<Author | null>(null);
	const [books, setBooks] = useState<Book[]>([]);
	const [loading, setLoading] = useState(true);
	const [following, setFollowing] = useState(false);
	const [followLoading, setFollowLoading] = useState(false);
	const [showFullBio, setShowFullBio] = useState(false);

	useEffect(() => {
		fetchData();
	}, [id]);

	async function fetchData() {
		setLoading(true);
		const [authorRes, booksRes] = await Promise.all([
			authorsApi.get(id, user?.id),
			authorsApi.getBooks(id, { limit: 30, orderBy: "created_at" }),
		]);
		if (authorRes.data) {
			setAuthor(authorRes.data);
			setFollowing(authorRes.data.is_followed ?? false);
		}
		if (booksRes.data) setBooks(booksRes.data);
		setLoading(false);
	}

	async function handleFollowToggle() {
		if (!user || isGuest) {
			Alert.alert(
				"Cần đăng nhập",
				"Vui lòng đăng nhập để theo dõi tác giả.",
				[
					{ text: "Để sau", style: "cancel" },
					{ text: "Đăng nhập", onPress: () => router.push("/auth/login" as any) },
				],
			);
			return;
		}
		setFollowLoading(true);
		const { data: newState } = await followsApi.toggle(user.id, id);
		if (newState !== null) {
			setFollowing(newState);
			setAuthor((prev) =>
				prev
					? {
						...prev,
						follower_count: prev.follower_count + (newState ? 1 : -1),
						is_followed: newState,
					}
					: prev,
			);
		}
		setFollowLoading(false);
	}

	function formatFollowers(count: number) {
		if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
		if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
		return count.toString();
	}

	function BookCard({ item }: { item: Book }) {
		return (
			<TouchableOpacity
				style={s.bookCard}
				onPress={() =>
					router.push({ pathname: "/book/[id]", params: { id: item.id } })
				}
			>
				<View style={s.bookCover}>
					{item.cover_url ? (
						<Image source={{ uri: item.cover_url }} style={s.coverImg} />
					) : (
						<View style={s.coverPlaceholder}>
							<Text style={s.coverEmoji}>
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
					{item.total_chapters ?? 0} chương
				</Text>
			</TouchableOpacity>
		);
	}

	if (loading) {
		return (
			<SafeAreaView style={s.container}>
				<View style={s.center}>
					<ActivityIndicator color={PINK} />
				</View>
			</SafeAreaView>
		);
	}

	if (!author) {
		return (
			<SafeAreaView style={s.container}>
				<View style={s.header}>
					<TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
						<Text style={s.headerBack}>←</Text>
					</TouchableOpacity>
				</View>
				<View style={s.center}>
					<Text style={s.emptyText}>Không tìm thấy tác giả</Text>
				</View>
			</SafeAreaView>
		);
	}

	const bioText = author.bio ?? "Chưa có giới thiệu.";
	const bioTruncated = bioText.length > 120 && !showFullBio;
	const displayBio = bioTruncated ? bioText.slice(0, 120) + "..." : bioText;

	return (
		<SafeAreaView style={s.container}>
			{/* Header */}
			<View style={s.header}>
				<TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
					<Text style={s.headerBack}>←</Text>
				</TouchableOpacity>
				<Text style={s.headerTitle} numberOfLines={1}>
					Tác Giả
				</Text>
				<View style={{ width: 36 }} />
			</View>

			<ScrollView showsVerticalScrollIndicator={false}>
				{/* Avatar + tên + follow */}
				<View style={s.heroSection}>
					<View style={s.avatarWrap}>
						{author.avatar_url ? (
							<Image source={{ uri: author.avatar_url }} style={s.avatar} />
						) : (
							<View style={s.avatarPlaceholder}>
								<Text style={s.avatarLetter}>
									{author.name.charAt(0).toUpperCase()}
								</Text>
							</View>
						)}
						{author.verified && (
							<View style={s.verifiedBadge}>
								<Text style={s.verifiedText}>✓</Text>
							</View>
						)}
					</View>

					<Text style={s.authorName}>{author.name}</Text>

					{/* Stats row */}
					<View style={s.statsRow}>
						<View style={s.statItem}>
							<Text style={s.statValue}>{books.length}</Text>
							<Text style={s.statLabel}>Tác phẩm</Text>
						</View>
						<View style={s.statDivider} />
						<View style={s.statItem}>
							<Text style={s.statValue}>
								{formatFollowers(author.follower_count)}
							</Text>
							<Text style={s.statLabel}>Người theo dõi</Text>
						</View>
						<View style={s.statDivider} />
						<View style={s.statItem}>
							<Text style={s.statValue}>
								{books.filter((b) => b.is_full).length}
							</Text>
							<Text style={s.statLabel}>Đã hoàn</Text>
						</View>
					</View>

					{/* Follow button */}
					<TouchableOpacity
						style={[s.followBtn, following && s.followBtnActive]}
						onPress={handleFollowToggle}
						disabled={followLoading}
					>
						{followLoading ? (
							<ActivityIndicator color={following ? PINK : "#fff"} size="small" />
						) : (
							<Text style={[s.followBtnText, following && s.followBtnTextActive]}>
								{following ? "✓ Đang theo dõi" : "+ Theo dõi"}
							</Text>
						)}
					</TouchableOpacity>
				</View>

				{/* Giới thiệu */}
				<View style={s.bioSection}>
					<Text style={s.sectionTitle}>Giới thiệu</Text>
					<Text style={s.bioText}>{displayBio}</Text>
					{bioText.length > 120 && (
						<TouchableOpacity onPress={() => setShowFullBio((v) => !v)}>
							<Text style={s.bioToggle}>
								{showFullBio ? "Thu gọn ▲" : "Xem thêm ▼"}
							</Text>
						</TouchableOpacity>
					)}
				</View>

				{/* Danh sách tác phẩm */}
				<View style={s.booksSection}>
					<Text style={s.sectionTitle}>
						Tác phẩm ({books.length})
					</Text>
					{books.length === 0 ? (
						<Text style={s.emptyText}>Chưa có tác phẩm nào.</Text>
					) : (
						<FlatList
							data={books}
							keyExtractor={(item) => item.id}
							numColumns={3}
							scrollEnabled={false}
							columnWrapperStyle={s.bookRow}
							contentContainerStyle={s.bookGrid}
							renderItem={({ item }) => <BookCard item={item} />}
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

	// Header
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	headerBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
	headerBack: { color: PINK, fontSize: 22, fontWeight: "bold" },
	headerTitle: { color: "#fff", fontSize: 17, fontWeight: "bold" },

	// Hero
	heroSection: {
		alignItems: "center",
		paddingVertical: 28,
		paddingHorizontal: 24,
	},
	avatarWrap: { position: "relative", marginBottom: 16 },
	avatar: { width: 90, height: 90, borderRadius: 45 },
	avatarPlaceholder: {
		width: 90,
		height: 90,
		borderRadius: 45,
		backgroundColor: "#333",
		alignItems: "center",
		justifyContent: "center",
	},
	avatarLetter: { color: "#fff", fontSize: 36, fontWeight: "700" },
	verifiedBadge: {
		position: "absolute",
		bottom: 0,
		right: 0,
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: "#4a9eff",
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
		marginBottom: 20,
		textAlign: "center",
	},

	// Stats
	statsRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 24,
		backgroundColor: "#161616",
		borderRadius: 14,
		paddingVertical: 16,
		paddingHorizontal: 24,
		gap: 0,
	},
	statItem: { flex: 1, alignItems: "center" },
	statValue: { color: "#fff", fontSize: 18, fontWeight: "700" },
	statLabel: { color: "#666", fontSize: 12, marginTop: 3 },
	statDivider: { width: 1, height: 32, backgroundColor: "#2a2a2a" },

	// Follow button
	followBtn: {
		borderWidth: 1.5,
		borderColor: PINK,
		borderRadius: 24,
		paddingVertical: 10,
		paddingHorizontal: 36,
		minWidth: 160,
		alignItems: "center",
	},
	followBtnActive: { backgroundColor: "#1a0812" },
	followBtnText: { color: PINK, fontSize: 15, fontWeight: "700" },
	followBtnTextActive: { color: PINK },

	// Bio
	bioSection: { paddingHorizontal: 20, marginBottom: 24 },
	sectionTitle: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
		marginBottom: 10,
	},
	bioText: { color: "#aaa", fontSize: 14, lineHeight: 22 },
	bioToggle: { color: PINK, fontSize: 13, marginTop: 6 },

	// Books grid
	booksSection: { paddingHorizontal: 16, marginBottom: 8 },
	bookGrid: { gap: 0 },
	bookRow: { gap: 12, marginBottom: 16 },
	bookCard: { width: CARD_WIDTH },
	bookCover: {
		width: CARD_WIDTH,
		height: CARD_WIDTH * 1.4,
		borderRadius: 8,
		overflow: "hidden",
		marginBottom: 6,
		position: "relative",
	},
	coverImg: { width: "100%", height: "100%", resizeMode: "cover" },
	coverPlaceholder: {
		width: "100%",
		height: "100%",
		backgroundColor: "#1e1e1e",
		alignItems: "center",
		justifyContent: "center",
	},
	coverEmoji: { fontSize: 28 },
	fullBadge: {
		position: "absolute",
		top: 0,
		left: 0,
		backgroundColor: "#2ecc71",
		paddingHorizontal: 5,
		paddingVertical: 2,
		borderBottomRightRadius: 6,
	},
	fullBadgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
	bookTitle: { color: "#ddd", fontSize: 12, lineHeight: 16, marginBottom: 2 },
	bookChapters: { color: "#555", fontSize: 11 },

	emptyText: { color: "#666", fontSize: 14, paddingVertical: 20 },
});