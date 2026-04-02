import { useEffect, useState } from "react";
import {
	Alert,
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type Book = {
  id: string;
  title: string;
  author: string;
  tag: "novel" | "book";
};

export default function LibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filter, setFilter] = useState<"all" | "novel" | "book">("all");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchBooks();
  }, [filter]);

  async function fetchBooks() {
    setLoading(true);
    let query = supabase.from("books").select("*");
    if (filter !== "all") query = query.eq("tag", filter);
    const { data } = await query;
    setBooks(data || []);
    setLoading(false);
  }

  async function handleDownload(book: Book) {
    setDownloading(book.id);
    const { error } = await supabase.from("user_library").insert({
      book_id: book.id,
      source: "download",
      title: book.title,
      author: book.author,
      tag: book.tag,
    });
    setDownloading(null);
    if (error) {
      Alert.alert("Lỗi", "Không thể download sách này");
    } else {
      Alert.alert("✅ Thành công", `"${book.title}" đã lưu vào My Library`);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🌐 Library</Text>

      <View style={styles.filters}>
        {(["all", "novel", "book"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === "all" ? "Tất cả" : f === "novel" ? "📖 Novel" : "📚 Book"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <Text style={styles.loading}>Đang tải...</Text>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.tagIcon}>
                  {item.tag === "novel" ? "📖" : "📚"}
                </Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.author}>{item.author}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.dlBtn,
                  downloading === item.id && styles.dlBtnLoading,
                ]}
                onPress={() => handleDownload(item)}
                disabled={downloading === item.id}
              >
                <Text style={styles.dlText}>
                  {downloading === item.id ? "..." : "💾"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", paddingTop: 16 },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
  },
  filterActive: { backgroundColor: "#6366f1" },
  filterText: { color: "#888", fontSize: 13 },
  filterTextActive: { color: "#fff" },
  loading: { color: "#888", textAlign: "center", marginTop: 40 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
    padding: 14,
  },
  cardLeft: { marginRight: 12 },
  tagIcon: { fontSize: 28 },
  cardRight: { flex: 1 },
  title: { color: "#fff", fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  author: { color: "#888", fontSize: 13 },
  dlBtn: { backgroundColor: "#2a2a2a", borderRadius: 8, padding: 8 },
  dlBtnLoading: { opacity: 0.5 },
  dlText: { fontSize: 18 },
});
