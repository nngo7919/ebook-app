import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	Alert,
	FlatList,
	Image,
	SafeAreaView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { supabase } from "../lib/supabase";

type MyBook = {
  id: string;
  title: string;
  author: string;
  tag: string;
  source: "download" | "upload";
  book_id: string;
  cover_url?: string;
  current_chapter?: number;
  total_chapters?: number;
};

export default function BookListScreen() {
  const router = useRouter();
  const { type, title } = useLocalSearchParams<{
    type: string;
    title: string;
  }>();

  const [allBooks, setAllBooks] = useState<MyBook[]>([]);
  const [filtered, setFiltered] = useState<MyBook[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, [type]);

  async function fetchBooks() {
    setLoading(true);
    let q = supabase
      .from("user_library")
      .select("*")
      .eq("user_id", "local-user")
      .order("created_at", { ascending: false });

    if (type === "download") {
      q = q.eq("source", "download");
    }

    const { data } = await q;
    const books = data || [];
    setAllBooks(books);
    setFiltered(books);
    setLoading(false);
  }

  function handleSearch(text: string) {
    setQuery(text);
    if (!text.trim()) {
      setFiltered(allBooks);
      return;
    }
    const lower = text.toLowerCase();
    setFiltered(allBooks.filter((b) => b.title.toLowerCase().includes(lower)));
  }

  function handleClearAll() {
    Alert.alert(
      "Xoá Tất Cả",
      `Bạn có chắc muốn xoá toàn bộ danh sách "${title}"?`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            // TODO: xoá theo type trong DB
            setAllBooks([]);
            setFiltered([]);
          },
        },
      ],
    );
  }

  function BookItem({ item }: { item: MyBook }) {
    const chapters =
      item.total_chapters ?? Math.floor(Math.random() * 1500 + 100);
    const currentChapter = item.current_chapter ?? 1;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => router.push(`/reader/${item.book_id || item.id}`)}
      >
        <View style={styles.info}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={{ height: 8 }} />
          <Text style={styles.itemMeta}>{chapters} chương　【FULL】</Text>
          <Text style={styles.itemCurrent}>Đang xem: {currentChapter}</Text>
        </View>

        {/* Cover */}
        <View style={styles.coverWrapper}>
          {item.cover_url ? (
            <Image source={{ uri: item.cover_url }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={{ fontSize: 28 }}>
                {item.tag === "novel" ? "📖" : "📚"}
              </Text>
            </View>
          )}
          <View style={styles.fullBadge}>
            <Text style={styles.fullBadgeText}>FULL</Text>
          </View>
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
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={styles.clearAll}>Xoá Tất Cả</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Nhập tên truyện cần tìm"
          placeholderTextColor="#444"
          value={query}
          onChangeText={handleSearch}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Đang tải...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Chưa có sách nào</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <BookItem item={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { color: "#4a9eff", fontSize: 22, fontWeight: "bold" },
  headerTitle: {
    flex: 1,
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
  },
  clearAll: { color: "#4a9eff", fontSize: 14 },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: "#ffffff", fontSize: 15 },
  clearBtn: { color: "#555", fontSize: 16, paddingHorizontal: 4 },

  // List item
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  info: { flex: 1 },
  itemTitle: {
    color: "#4a9eff",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  itemMeta: { color: "#888", fontSize: 13, marginBottom: 2 },
  itemCurrent: { color: "#666", fontSize: 13 },

  // Cover
  coverWrapper: {
    width: 72,
    height: 100,
    borderRadius: 6,
    overflow: "hidden",
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

  separator: { height: 1, backgroundColor: "#1a1a1a", marginHorizontal: 16 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#555", fontSize: 14 },
});
