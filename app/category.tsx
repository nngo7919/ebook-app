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
import { supabase } from "../lib/supabase";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.45;

type Book = {
  id: string;
  title: string;
  author: string;
  tag: "novel" | "book";
  cover_url?: string;
  views?: number;
  rating?: number;
};

export default function CategoryScreen() {
  const { title } = useLocalSearchParams<{ title: string }>();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, []);

  async function fetchBooks() {
    setLoading(true);
    const { data } = await supabase
      .from("books")
      .select("*")
      .order("created_at", { ascending: false });
    setBooks(data || []);
    setLoading(false);
  }

  function BookCard({ item }: { item: Book }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/reader/${item.id}`)}
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
          <Text style={styles.metaText}>☆ {item.rating ?? "5.0"}</Text>
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
        <TouchableOpacity style={styles.sortBtn}>
          <Text style={styles.sortIcon}>⇅</Text>
        </TouchableOpacity>
      </View>

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
});
