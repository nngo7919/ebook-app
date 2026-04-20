import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

const COVER_SIZE = 90;

type Book = {
  id: string;
  title: string;
  author: string;
  tag: "novel" | "book";
  cover_url?: string;
};

const TIME_TABS = ["Ngày", "Tuần", "Tháng"];

const FAKE_GENRES: Record<string, string> = {
  novel: "Ngôn Tình · Hiện Đại · HE · Đô Thị...",
  book: "Kỹ Năng · Tâm Lý · Phát Triển Bản Thân...",
};

export default function TrendingScreen() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchBooks();
  }, [activeTab]);

  async function fetchBooks() {
    setLoading(true);
    const { data } = await supabase
      .from("books")
      .select("*")
      .order("created_at", { ascending: false });
    setBooks(data || []);
    setLoading(false);
  }

  function RankItem({ item, index }: { item: Book; index: number }) {
    const fakeChapters = Math.floor(Math.random() * 900) + 50;
    const genres = FAKE_GENRES[item.tag] ?? "Ngôn Tình · Hiện Đại · HE...";

    return (
      <TouchableOpacity
        style={styles.rankItem}
        onPress={() =>
          router.push({ pathname: "/book/[id]", params: { id: item.id } })
        }
      >
        <Text style={styles.rankNumber}>{index + 1}</Text>
        <View style={styles.rankInfo}>
          <Text style={styles.rankTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={{ height: 8 }} />
          <Text style={styles.rankMeta}>{fakeChapters} chương　【FULL】</Text>
          <Text style={styles.rankGenres} numberOfLines={1}>
            {genres}
          </Text>
        </View>
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
        <Text style={styles.headerTitle}>Thịnh Hành</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Time tabs - căn giữa */}
      <View style={styles.tabBar}>
        {TIME_TABS.map((tab, i) => (
          <TouchableOpacity
            key={i}
            style={styles.tabItem}
            onPress={() => setActiveTab(i)}
          >
            <Text
              style={[styles.tabText, activeTab === i && styles.tabTextActive]}
            >
              {tab}
            </Text>
            {activeTab === i && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : books.length === 0 ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Chưa có dữ liệu</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id + activeTab}
          renderItem={({ item, index }) => (
            <RankItem item={item} index={index} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },

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
  backIcon: { color: "#4a9eff", fontSize: 22, fontWeight: "bold" },
  headerTitle: { color: "#ffffff", fontSize: 17, fontWeight: "bold" },

  // Tabs căn giữa
  tabBar: {
    flexDirection: "row",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    marginBottom: 4,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignItems: "center",
    position: "relative",
  },
  tabText: { color: "#888", fontSize: 15, fontWeight: "500" },
  tabTextActive: { color: "#ffffff", fontWeight: "bold" },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#4a9eff",
    borderRadius: 2,
  },

  // Rank item
  rankItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  rankNumber: {
    color: "#4a9eff",
    fontSize: 18,
    fontWeight: "bold",
    width: 24,
    textAlign: "center",
  },
  rankInfo: { flex: 1 },
  rankTitle: {
    color: "#4a9eff",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  rankMeta: { color: "#888", fontSize: 12, marginBottom: 4 },
  rankGenres: { color: "#666", fontSize: 12 },

  coverWrapper: {
    width: COVER_SIZE,
    height: COVER_SIZE * 1.35,
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
  coverEmoji: { fontSize: 28 },
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
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#888" },
});
