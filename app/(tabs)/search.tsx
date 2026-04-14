import { useRouter } from "expo-router";
import { useState } from "react";
import {
	FlatList,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { supabase } from "../../lib/supabase";

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

type Book = {
  id: string;
  title: string;
  author: string;
  tag: string;
};

type Tab = "tag" | "search";

export default function SearchScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("tag");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    const clean = text.trim().replace(/^"|"$/g, "");
    const { data } = await supabase
      .from("books")
      .select("*")
      .or(`title.ilike.%${clean}%,author.ilike.%${clean}%`)
      .limit(30);
    setResults(data || []);
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

  function SearchResults() {
    if (!searched) {
      return (
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            Bạn có thể nhập tên truyện như:{"\n"}
            me chong nha nong
          </Text>
          <Text style={styles.hintText2}>
            Để tìm chính xác kết quả, bạn cần thêm dấu nháy {'" "'}
            {"\n"}vào cụm từ như:{"\n"}
            "me chong nha nong "
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
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => router.push(`/reader/${item.id}`)}
          >
            <View style={styles.resultCover}>
              <Text style={{ fontSize: 24 }}>
                {item.tag === "novel" ? "📖" : "📚"}
              </Text>
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.resultAuthor}>{item.author}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
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

      {/* Search bar — chỉ hiện ở tab search */}
      {activeTab === "search" && (
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Nhập tên truyện hoặc tác giả"
            placeholderTextColor="#555"
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
            >
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === "tag" ? <TagGrid /> : <SearchResults />}
      </View>

      {/* Bottom sub-tabs */}
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={styles.subTab}
          onPress={() => setActiveTab("tag")}
        >
          <Text
            style={[
              styles.subTabIcon,
              activeTab === "tag" && styles.subTabIconActive,
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
              activeTab === "search" && styles.subTabIconActive,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    position: "relative",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },
  filterIconBtn: { position: "absolute", right: 16 },
  filterIcon: { color: "#4a9eff", fontSize: 22 },

  // Search bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 15,
  },
  clearBtn: { color: "#555", fontSize: 16, paddingHorizontal: 4 },

  // Tag grid
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

  // Search results
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
  filterLink: {
    color: "#4a9eff",
    fontSize: 16,
    fontWeight: "600",
  },
  resultItem: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  resultCover: {
    width: 50,
    height: 70,
    backgroundColor: "#1e1e1e",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  resultInfo: { flex: 1, justifyContent: "center" },
  resultTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  resultAuthor: { color: "#888", fontSize: 13 },

  // Sub tab bar
  subTabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    backgroundColor: "#0d0d0d",
  },
  subTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    gap: 4,
  },
  subTabIcon: { fontSize: 20, color: "#555" },
  subTabIconActive: { color: "#4a9eff" },
  subTabLabel: { fontSize: 11, color: "#555", fontWeight: "500" },
  subTabLabelActive: { color: "#4a9eff" },
});
