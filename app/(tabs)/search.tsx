import { books as booksApi } from "@/app/lib/api";
import { FAKE_BOOKS } from "@/app/lib/fake-data";
import type { Book } from "@/app/lib/types";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PINK = "#e91e8c";

const TAGS = [
  "TYT",
  "TYT Đoàn Văn",
  "Ngôn Tình",
  "Ngược",
  "Đam Mỹ",
  "Hài Hước",
  "Đô Thị",
  "Hiện Đại",
  "Niên Đại",
  "Cổ Đại",
  "Tương Lai",
  "Xuyên Không",
  "Xuyên Nhanh",
  "Truyện Teen",
  "Tổng Tài",
  "Kiếm Hiệp",
  "Tiên Hiệp",
  "Nam Sinh",
  "Sủng",
  "Mạt Thế",
  "Bách Hợp",
  "Đông Phương",
  "Cung Đấu",
  "Gia Đấu",
  "Võ Hiệp",
  "Huyền Huyễn",
  "Dị Giới",
  "Linh Dị",
];

type Tab = "tag" | "search";

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `ngày ${d.getDate()} thg ${d.getMonth() + 1}, ${d.getFullYear()}`;
}

export default function SearchScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("tag");
  const [query, setQuery] = useState("");
  const [allResults, setAllResults] = useState<Book[]>([]);
  const [results, setResults] = useState<Book[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"created_at" | "views" | "likes" | "rating_avg">("created_at");
  const [showSort, setShowSort] = useState(false);

  const SORT_OPTIONS = [
    { key: "created_at" as const, label: "Mới nhất" },
    { key: "views" as const, label: "Lượt xem" },
    { key: "likes" as const, label: "Yêu thích" },
    { key: "rating_avg" as const, label: "Đánh giá" },
  ];

  useEffect(() => {
    const sorted = [...allResults].sort((a, b) => {
      if (sortBy === "views") return (b.views ?? 0) - (a.views ?? 0);
      if (sortBy === "likes") return (b.likes ?? 0) - (a.likes ?? 0);
      if (sortBy === "rating_avg") return (b.rating_avg ?? 0) - (a.rating_avg ?? 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setResults(sorted);
  }, [sortBy, allResults]);

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.trim().length < 2) {
      setAllResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    const { data } = await booksApi.search(text.trim());
    if (data && data.length > 0) {
      setAllResults(data);
    } else {
      const q = text.trim().toLowerCase();
      const fakeResults = FAKE_BOOKS.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.genres ?? "").toLowerCase().includes(q),
      );
      setAllResults(fakeResults.length > 0 ? fakeResults : FAKE_BOOKS);
    }
    setLoading(false);
  }

  function TagGrid() {
    return (
      <FlatList
        data={TAGS}
        keyExtractor={(item) => item}
        numColumns={2}
        contentContainerStyle={styles.tagGrid}
        columnWrapperStyle={styles.tagRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tagBtn}
            onPress={() =>
              router.push({ pathname: "/category", params: { title: item } })
            }
          >
            <Text style={styles.tagText}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    );
  }

  function ResultItem({ item }: { item: Book }) {
    const chapters =
      item.total_chapters ?? Math.floor(Math.random() * 1500 + 50);
    const isFull = item.is_full !== false;
    const genres =
      item.genres ??
      (item.tag === "novel"
        ? "Ngôn Tình · Cổ Đại · Điền Văn"
        : "Kỹ Năng · Phát Triển Bản Thân");
    const dateStr = formatDate(item.created_at);

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() =>
          router.push({ pathname: "/book/[id]", params: { id: item.id } })
        }
      >
        <View style={styles.resultInfo}>
          <Text style={styles.resultMeta}>
            {dateStr ? `${dateStr}  ` : ""}
            <Text style={styles.resultAuthor}>▸{item.author}</Text>
          </Text>
          <Text style={styles.resultTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.resultChapters}>
            {chapters} chương{isFull ? "　【FULL】" : ""}
          </Text>
          <Text style={styles.resultGenres} numberOfLines={1}>
            {genres}
          </Text>
        </View>

        <View style={styles.coverWrapper}>
          {item.cover_url ? (
            <Image source={{ uri: item.cover_url }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={{ fontSize: 26 }}>
                {item.tag === "novel" ? "📖" : "📚"}
              </Text>
            </View>
          )}
          {isFull && (
            <View style={styles.fullBadge}>
              <Text style={styles.fullBadgeText}>FULL</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  function SearchContent() {
    if (!searched) {
      return (
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            Bạn có thể nhập tên truyện như:{"\n"}me chong nha nong
          </Text>
          <Text style={styles.hintText2}>
            Để tìm chính xác kết quả, bạn cần thêm dấu nháy {'" "'}
            {"\n"}vào cụm từ như:{"\n"} {"me chong nha nong"}
          </Text>
          <TouchableOpacity>
            <Text style={styles.filterLink}>Tìm Với Bộ Lọc Truyện</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Đang tìm...</Text>
        </View>
      );
    }

    if (results.length === 0) {
      return (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Không tìm thấy kết quả nào</Text>
        </View>
      );
    }

    return (
      <>
        {/* Sort bar */}
        <View style={styles.sortBar}>
          <Text style={styles.sortBarLabel}>Sắp xếp:</Text>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortChip, sortBy === opt.key && styles.sortChipActive]}
              onPress={() => setSortBy(opt.key)}
            >
              <Text style={[styles.sortChipText, sortBy === opt.key && styles.sortChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 80 }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => <ResultItem item={item} />}
        />
      </>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {activeTab === "tag" ? "Tag - Thể Loại" : "Tìm Truyện"}
        </Text>
        {activeTab === "search" && (
          <TouchableOpacity style={styles.filterIconBtn}>
            <Text style={styles.filterIcon}>≡</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search bar */}
      {activeTab === "search" && (
        <View style={styles.searchBar}>
          <Text style={styles.searchIconText}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Nhập tên truyện hoặc tác giả"
            placeholderTextColor="#444"
            value={query}
            onChangeText={handleSearch}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setResults([]);
                setSearched(false);
              }}
              style={styles.clearCircle}
            >
              <Text style={styles.clearCircleText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={{ flex: 1 }}>
        {activeTab === "tag" ? <TagGrid /> : <SearchContent />}
      </View>

      {/* Sub tab bar */}
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={styles.subTab}
          onPress={() => setActiveTab("tag")}
        >
          <Text
            style={[
              styles.subTabIcon,
              activeTab === "tag" && styles.subTabActive,
            ]}
          >
            ⊞
          </Text>
          <Text
            style={[
              styles.subTabLabel,
              activeTab === "tag" && styles.subTabLabelActive,
            ]}
          >
            Tag
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.subTab}
          onPress={() => setActiveTab("search")}
        >
          <Text
            style={[
              styles.subTabIcon,
              activeTab === "search" && styles.subTabActive,
            ]}
          >
            🔍
          </Text>
          <Text
            style={[
              styles.subTabLabel,
              activeTab === "search" && styles.subTabLabelActive,
            ]}
          >
            Tìm Truyện
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: "relative",
  },
  headerTitle: { color: "#ffffff", fontSize: 17, fontWeight: "bold" },
  filterIconBtn: { position: "absolute", right: 16 },
  filterIcon: { color: PINK, fontSize: 24 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
  },
  searchIconText: { fontSize: 16 },
  searchInput: { flex: 1, color: "#ffffff", fontSize: 16 },
  clearCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#444",
    alignItems: "center",
    justifyContent: "center",
  },
  clearCircleText: { color: "#fff", fontSize: 11, fontWeight: "bold" },

  tagGrid: { padding: 12, paddingBottom: 24 },
  tagRow: { gap: 12, marginBottom: 12 },
  tagBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tagText: { color: "#ffffff", fontSize: 15, fontWeight: "500" },

  resultItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  resultInfo: { flex: 1 },
  resultMeta: { color: "#666", fontSize: 12, marginBottom: 4 },
  resultAuthor: { color: "#666", fontSize: 12 },
  resultTitle: {
    color: PINK,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    marginBottom: 4,
  },
  resultChapters: { color: "#888", fontSize: 13, marginBottom: 3 },
  resultGenres: { color: "#666", fontSize: 12 },

  coverWrapper: {
    width: 76,
    height: 104,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
    flexShrink: 0,
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

  hint: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 20,
  },
  hintText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  hintText2: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  filterLink: { color: PINK, fontSize: 16, fontWeight: "600" },

  subTabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    backgroundColor: "#0d0d0d",
  },
  subTab: { flex: 1, alignItems: "center", paddingVertical: 10, gap: 4 },
  subTabIcon: { fontSize: 20, color: "#555" },
  subTabActive: { color: PINK },
  subTabLabel: { fontSize: 11, color: "#555", fontWeight: "500" },
  subTabLabelActive: { color: PINK },

  // Sort bar
  sortBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexWrap: "wrap",
    borderBottomWidth: 0.5,
    borderBottomColor: "#1a1a1a",
  },
  sortBarLabel: { color: "#666", fontSize: 12 },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  sortChipActive: { backgroundColor: PINK, borderColor: PINK },
  sortChipText: { color: "#aaa", fontSize: 12 },
  sortChipTextActive: { color: "#fff", fontWeight: "700" },
});