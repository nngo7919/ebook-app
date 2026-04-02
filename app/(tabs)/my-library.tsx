import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type MyBook = {
  id: string;
  title: string;
  author: string;
  tag: string;
  source: "download" | "upload";
};

export default function MyLibraryScreen() {
  const [books, setBooks] = useState<MyBook[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchMyBooks();
  }, []);

  async function fetchMyBooks() {
    setLoading(true);
    const { data } = await supabase
      .from("user_library")
      .select("*")
      .order("created_at", { ascending: false });
    setBooks(data || []);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>📥 My Library</Text>

      {loading ? (
        <Text style={styles.loading}>Đang tải...</Text>
      ) : books.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyText}>Chưa có sách nào</Text>
          <Text style={styles.emptySub}>
            Download từ Library hoặc upload file
          </Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/reader/${item.id}`)}
            >
              <Text style={styles.tagIcon}>
                {item.tag === "novel" ? "📖" : "📚"}
              </Text>
              <View style={styles.cardRight}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.author}>{item.author}</Text>
                <Text style={styles.source}>
                  {item.source === "download" ? "💾 Downloaded" : "📤 Uploaded"}
                </Text>
              </View>
            </TouchableOpacity>
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
    marginBottom: 16,
  },
  loading: { color: "#888", textAlign: "center", marginTop: 40 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  emptySub: { color: "#888", fontSize: 13 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
    padding: 14,
  },
  tagIcon: { fontSize: 28, marginRight: 12 },
  cardRight: { flex: 1 },
  title: { color: "#fff", fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  author: { color: "#888", fontSize: 13, marginBottom: 4 },
  source: { color: "#6366f1", fontSize: 11 },
});
