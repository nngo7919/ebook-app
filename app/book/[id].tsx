import { books as booksApi, favorites as favApi, progress as progressApi, ratings as ratingsApi } from "@/app/lib/api";
import { useAuth } from "@/app/lib/auth";
import { FAKE_BOOKS } from "@/app/lib/fake-data";
import type { Book } from "@/app/lib/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PINK = "#e91e8c";

function formatMinutes(dateStr?: string) {
  if (!dateStr) return "vài phút";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 60) return `${diff} phút`;
  if (diff < 1440) return `${Math.floor(diff / 60)} giờ`;
  return `${Math.floor(diff / 1440)} ngày`;
}

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [lastChapter, setLastChapter] = useState<number | null>(null);
  const [userRating, setUserRating] = useState<number>(0);

  useEffect(() => {
    fetchBook();
  }, [id]);

  // Check favorite status — không check cho guest
  useEffect(() => {
    if (user && !isGuest && id) {
      favApi.check(user.id, id).then(({ data }) => setLiked(!!data));
    }
  }, [user, isGuest, id]);

  // Load reading progress để biết đọc tiếp chương nào
  useEffect(() => {
    if (user && !isGuest && id) {
      progressApi.get(user.id, id).then(({ data }) => {
        if (data?.chapter_number) setLastChapter(data.chapter_number);
      });
    }
  }, [user, isGuest, id]);

  // Load rating của user
  useEffect(() => {
    if (user && !isGuest && id) {
      ratingsApi.get(user.id, id).then(({ data }) => {
        if (data?.rating) setUserRating(data.rating);
      });
    }
  }, [user, isGuest, id]);

  async function handleRate(star: number) {
    if (!user || isGuest) {
      Alert.alert("Cần đăng nhập", "Vui lòng đăng nhập để đánh giá.", [
        { text: "Để sau", style: "cancel" },
        { text: "Đăng nhập", onPress: () => router.push("/auth/login" as any) },
      ]);
      return;
    }
    const newRating = userRating === star ? 0 : star;
    setUserRating(newRating);
    if (newRating === 0) {
      await ratingsApi.delete(user.id, id);
    } else {
      await ratingsApi.post(user.id, id, newRating);
    }
  }

  async function fetchBook() {
    setLoading(true);
    const { data } = await booksApi.get(id);
    if (data) {
      setBook({ ...data, views: (data.views ?? 0) + 1 });
      // Guest dùng guestId, user đã đăng nhập dùng userId
      void booksApi.incrementViews(id, {
        userId: isGuest ? null : (user?.id ?? null),
        guestId: isGuest ? (user?.id ?? null) : null,
      });
    } else {
      const fake = FAKE_BOOKS.find((b) => b.id === id) ?? FAKE_BOOKS[0];
      setBook({ ...fake, id });
    }
    setLoading(false);
  }

  async function handleToggleLike() {
    if (!user || isGuest) {
      Alert.alert(
        "Cần đăng nhập",
        "Vui lòng đăng nhập để thêm truyện vào yêu thích.",
        [
          { text: "Để sau", style: "cancel" },
          { text: "Đăng nhập", onPress: () => router.push("/auth/login" as any) },
        ],
      );
      return;
    }
    const { data: newState } = await favApi.toggle(user.id, id);
    if (newState !== null) setLiked(newState);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Không tìm thấy truyện</Text>
        </View>
      </SafeAreaView>
    );
  }

  const chapters = book.total_chapters ?? 17;
  const likes = book.likes ?? 57;
  const views = book.views ?? 101;
  const authorName = book.author ?? "Äang cáº­p nháº­t";
  const ago = formatMinutes(book.created_at);
  const tags = book.genres
    ? book.genres.split(",").map((g) => g.trim())
    : (book?.genres_list ?? []);
  const allGenres = book.genres
    ? book.genres.split(",").map((g) => g.trim())
    : (book?.genres_list ?? []);
  const shortTitle =
    book.title.length > 18 ? book.title.slice(0, 18) + "..." : book.title;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
        >
          <Text style={styles.headerBack}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {shortTitle}
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn}>
            <Text style={styles.headerIcon}>⚑</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Text style={styles.headerIcon}>⬆</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Title */}
        <Text style={styles.title}>{book.title}</Text>

        {/* Info row */}
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            {/* Author */}
            <View style={styles.infoLine}>
              <Text style={styles.infoIcon}>✒</Text>
            </View>

            {/* Status */}
            <View style={styles.infoLine}>
              <Text style={styles.infoIcon}>☁</Text>
              <Text style={styles.infoText}>
                {book.is_full ? "Hoàn" : "Đang ra"}
                {"  "}
                <Text style={styles.infoMuted}>▸{ago}</Text>
              </Text>
            </View>

            {/* Chapters */}
            <View style={styles.infoLine}>
              <Text style={styles.infoIcon}>≡</Text>
              <Text style={styles.infoText}>{chapters}</Text>
            </View>

            {/* Likes + views */}
            <View style={styles.infoLine}>
              <Text style={styles.infoIcon}>♥</Text>
              <Text style={styles.infoText}>{likes}</Text>
              <Text style={[styles.infoIcon, { marginLeft: 16 }]}>◉</Text>
              <Text style={styles.infoText}>{views}</Text>
            </View>
          </View>

          {/* Cover */}
          <View style={styles.cover}>
            {book.cover_url ? (
              <Image
                source={{ uri: book.cover_url }}
                style={styles.coverImage}
              />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Text style={{ fontSize: 36 }}>
                  {book.tag === "novel" ? "📖" : "📚"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Tag chips */}
        <View style={styles.tagRow}>
          {tags.map((t, i) => (
            <TouchableOpacity
              key={i}
              style={styles.tagChip}
              onPress={() =>
                router.push({ pathname: "/category", params: { title: t } })
              }
            >
              <Text style={styles.tagChipText}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, liked && styles.actionBtnActive]}
            onPress={handleToggleLike}
          >
            <Text style={[styles.actionIcon, liked && styles.actionIconActive]}>
              {liked ? "♥" : "♡"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionIcon}>⊞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionIcon}>⊕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              Alert.alert("Thông báo", "Chức năng đang phát triển")
            }
          >
            <Text style={styles.actionIcon}>⊕</Text>
          </TouchableOpacity>
        </View>

        {/* Author info */}
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => {
            if (book.author_id) {
              router.push({
                pathname: "/author/[id]",
                params: { id: book.author_id },
              });
            }
          }}
          disabled={!book.author_id}
        >
          <View style={styles.authorAvatar}>
            <Text style={{ fontSize: 22 }}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.authorTime}>{ago}</Text>
          </View>
          {book.author_id && (
            <Text style={{ color: "#444", fontSize: 20 }}>›</Text>
          )}
        </TouchableOpacity>

        {/* Recent chapters */}
        <Text style={styles.sectionLabel}>Các số gần nhất</Text>
        <View style={styles.chapterRow}>
          {Array.from(
            { length: Math.min(5, chapters) },
            (_, i) => chapters - i,
          ).map((ch) => (
            <TouchableOpacity
              key={ch}
              style={styles.chapterChip}
              onPress={() =>
                router.push({
                  pathname: "/reader/[id]",
                  params: { id: book.id, chapter: ch },
                })
              }
            >
              <Text style={styles.chapterChipText}>{ch}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Genres */}
        <View style={styles.genreSection}>
          <Text style={styles.genreLabel}>Thể loại: </Text>
          <View style={styles.genreWrap}>
            {allGenres.map((g, i) => (
              <TouchableOpacity
                key={i}
                onPress={() =>
                  router.push({ pathname: "/category", params: { title: g } })
                }
              >
                <Text style={styles.genreLink}>
                  {g}
                  {i < allGenres.length - 1 ? " , " : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Editor */}
        {book.editor && (
          <Text style={styles.editorText}>Editor: {book.editor}</Text>
        )}

        {/* Description */}
        {book.description ? (
          <View style={styles.descSection}>
            <Text style={styles.descLabel}>Giới Thiệu</Text>
            <Text style={styles.descText}>{book.description}</Text>
          </View>
        ) : null}

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>
            {userRating > 0 ? `Đánh giá của bạn: ${userRating} sao` : "Đánh giá truyện này"}
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => handleRate(star)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <Text style={[styles.star, star <= userRating && styles.starActive]}>
                  {star <= userRating ? "★" : "☆"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {book.rating_avg > 0 && (
            <Text style={styles.ratingAvg}>
              Trung bình: {book.rating_avg.toFixed(1)} ★ ({book.rating_count} lượt)
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomDownload}
          onPress={async () => {
            if (!user || isGuest) {
              Alert.alert("Cần đăng nhập", "Vui lòng đăng nhập để tải truyện.", [
                { text: "Để sau", style: "cancel" },
                { text: "Đăng nhập", onPress: () => router.push("/auth/login" as any) },
              ]);
              return;
            }
            const { library: libApi } = await import("@/app/lib/api");
            const { data: err } = await libApi.add(user.id, {
              book_id: book.id,
              title: book.title,
              author: book.author ?? "Không rõ",
              tag: book.tag,
              cover_url: book.cover_url ?? undefined,
              source: "download",
            });
            if (err === true) Alert.alert("✅ Đã lưu", `"${book.title}" đã thêm vào Tải Gần Đây.`);
            else Alert.alert("Thông báo", "Đã lưu vào thư viện!");
          }}
        >
          <Text style={styles.bottomDownloadIcon}>⬇</Text>
          <Text style={styles.bottomDownloadText}>Tải Về</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomRead}
          onPress={() => {
            const chapterToOpen = lastChapter ?? 1;
            router.push({ pathname: "/reader/[id]", params: { id: book.id, chapter: chapterToOpen } });
          }}
        >
          <Text style={styles.bottomReadText}>
            {lastChapter ? `Đọc Tiếp · Chương ${lastChapter}` : "Đọc Truyện"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomToc}
          onPress={() =>
            router.push({ pathname: "/toc/[id]", params: { id: book.id } })
          }
        >
          <Text style={styles.bottomTocIcon}>≡</Text>
          <Text style={styles.bottomTocText}>Mục Lục</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#888" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  headerBtn: { padding: 8 },
  headerBack: { color: PINK, fontSize: 22, fontWeight: "bold" },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerRight: { flexDirection: "row" },
  headerIcon: { color: PINK, fontSize: 20 },

  // Title
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    lineHeight: 30,
  },

  // Info row
  infoRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 16,
  },
  infoLeft: { flex: 1, gap: 10 },
  infoLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoIcon: { color: "#888", fontSize: 16, width: 20, textAlign: "center" },
  infoText: { color: "#ccc", fontSize: 14 },
  infoMuted: { color: "#666", fontSize: 13 },

  // Cover
  cover: {
    width: 100,
    height: 136,
    borderRadius: 8,
    overflow: "hidden",
  },
  coverImage: { width: "100%", height: "100%", resizeMode: "cover" },
  coverPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1e1e1e",
    alignItems: "center",
    justifyContent: "center",
  },

  // Tags
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  tagChip: {
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tagChipText: { color: "#ccc", fontSize: 13 },

  // Actions
  actionRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  actionBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: PINK,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnActive: { backgroundColor: PINK },
  actionIcon: { color: PINK, fontSize: 20 },
  actionIconActive: { color: "#fff" },

  // Author
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  authorName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  authorTime: { color: "#666", fontSize: 13, marginTop: 2 },

  // Chapters
  sectionLabel: {
    color: "#ccc",
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  chapterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  chapterChip: {
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chapterChipText: { color: "#ccc", fontSize: 14 },

  // Genres
  genreSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  genreLabel: { color: "#ccc", fontSize: 14 },
  genreWrap: { flexDirection: "row", flexWrap: "wrap", flex: 1 },
  genreLink: { color: PINK, fontSize: 14, lineHeight: 22 },

  // Editor
  editorText: {
    color: "#888",
    fontSize: 13,
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 28,
    backgroundColor: "#0d0d0d",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    gap: 12,
  },
  bottomDownload: { alignItems: "center", width: 48 },
  bottomDownloadIcon: { color: PINK, fontSize: 20 },
  bottomDownloadText: { color: PINK, fontSize: 11, marginTop: 2 },
  bottomRead: {
    flex: 1,
    backgroundColor: PINK,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
  },
  bottomReadText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  bottomToc: { alignItems: "center", width: 48 },
  bottomTocIcon: { color: PINK, fontSize: 20 },
  bottomTocText: { color: PINK, fontSize: 11, marginTop: 2 },

  // Description
  descSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  descLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  descText: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 22,
  },

  // Star rating
  ratingSection: {
    paddingHorizontal: 20,
    marginBottom: 28,
    alignItems: "center",
  },
  ratingLabel: {
    color: "#888",
    fontSize: 13,
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  star: {
    fontSize: 32,
    color: "#333",
  },
  starActive: {
    color: "#f5a623",
  },
  ratingAvg: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
  },
});