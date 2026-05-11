import { books as booksApi } from "@/app/lib/api";
import { FAKE_BOOKS, FAKE_CATEGORY_MAP } from "@/app/lib/fake-data";
import type { Book } from "@/app/lib/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.45;

export default function CategoryScreen() {
  const { title } = useLocalSearchParams<{ title: string }>();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"created_at" | "views" | "likes" | "rating_avg">("created_at");
  const [showSort, setShowSort] = useState(false);

  const SORT_OPTIONS: { key: typeof sortBy; label: string }[] = [
    { key: "created_at", label: "Mới nhất" },
    { key: "views", label: "Lượt xem" },
    { key: "likes", label: "Yêu thích" },
    { key: "rating_avg", label: "Đánh giá" },
  ];

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    const sorted = [...allBooks].sort((a, b) => {
      if (sortBy === "views") return (b.views ?? 0) - (a.views ?? 0);
      if (sortBy === "likes") return (b.likes ?? 0) - (a.likes ?? 0);
      if (sortBy === "rating_avg") return (b.rating_avg ?? 0) - (a.rating_avg ?? 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setBooks(sorted);
  }, [sortBy, allBooks]);

  async function fetchBooks() {
    setLoading(true);
    const { data } = title
      ? await booksApi.byGenre(title)
      : await booksApi.list();
    if (data && data.length > 0) {
      setAllBooks(data);
    } else {
      const titleStr = (title as string) ?? "";
      const mapped = FAKE_CATEGORY_MAP[titleStr];
      if (mapped) {
        setAllBooks(mapped);
      } else {
        const filtered = FAKE_BOOKS.filter((b) =>
          b.genres_list?.some((g) =>
            g.toLowerCase().includes(titleStr.toLowerCase()),
          ),
        );
        setAllBooks(filtered.length > 0 ? filtered : FAKE_BOOKS);
      }
    }
    setLoading(false);
  }

  function BookCard({ item }: { item: Book }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({ pathname: "/book/[id]", params: { id: item.id } })
        }
      >
        {/* Cover */}
        <View style={styles.coverWrapper}>
          {item.cover_url ? (
            <Image source={{ uri: item.cover_url }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverEmoji}>
                {item.tag === "novel" ? "📖" : "📚"}
              </Text>
            </View>
          )}
          {/* FULL badge */}
          <View style={styles.fullBadge}>
            <Text style={styles.fullBadgeText}>FULL</Text>
          </View>
        </View>

        {/* Info */}
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.bookMeta}>
          <Text style={styles.metaText}>
            © {item.views ?? Math.floor(Math.random() * 2000 + 100)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || "Danh Sách"}</Text>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSort((v) => !v)}>
          <Text style={styles.sortIcon}>⇅</Text>
        </TouchableOpacity>
      </View>

      {/* Sort dropdown */}
      {showSort && (
        <View style={styles.sortDropdown}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortOption, sortBy === opt.key && styles.sortOptionActive]}
              onPress={() => { setSortBy(opt.key); setShowSort(false); }}
            >
              <Text style={[styles.sortOptionText, sortBy === opt.key && styles.sortOptionTextActive]}>
                {sortBy === opt.key ? "✓ " : ""}{opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Grid */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => <BookCard item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    color: "#4a9eff",
    fontSize: 22,
    fontWeight: "bold",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },
  sortBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  sortIcon: {
    color: "#4a9eff",
    fontSize: 20,
  },

  // Grid
  grid: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  row: {
    gap: 12,
    marginBottom: 20,
  },

  // Card
  card: {
    width: CARD_WIDTH,
  },
  coverWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 6,
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  coverPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1e1e1e",
    alignItems: "center",
    justifyContent: "center",
  },
  coverEmoji: {
    fontSize: 28,
  },
  fullBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#2ecc71",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderBottomRightRadius: 6,
  },
  fullBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  bookTitle: {
    color: "#dddddd",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 3,
  },
  bookMeta: {
    flexDirection: "row",
    gap: 6,
  },
  metaText: {
    color: "#777",
    fontSize: 11,
  },

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#888",
  },

  // Sort dropdown
  sortDropdown: {
    position: "absolute",
    top: 60,
    right: 12,
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    zIndex: 100,
    overflow: "hidden",
    minWidth: 140,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2a2a2a",
  },
  sortOptionActive: { backgroundColor: "#2a2a2a" },
  sortOptionText: { color: "#ccc", fontSize: 14 },
  sortOptionTextActive: { color: "#e91e8c", fontWeight: "700" },
});