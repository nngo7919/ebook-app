import { books as booksApi } from "@/app/lib/api";
import { FAKE_BOOKS } from "@/app/lib/fake-data";
import type { Book } from "@/app/lib/types";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const BOOK_CARD_WIDTH = (width - 48) / 3.5;

const QUICK_FILTERS = [
  { icon: "⭐", label: "Đánh Giá", route: "category" },
  { icon: "❤️", label: "Yêu Thích", route: "category" },
  { icon: "📊", label: "Xem Nhiều", route: "category" },
  { icon: "📈", label: "Thịnh Hành", route: "trending" },
];

const FULL_CATEGORIES = [
  { label: "Full – Mới Cập Nhật" },
  { label: "Full – Đánh Giá Cao" },
  { label: "Full – Yêu Thích" },
  { label: "Full – Xem Nhiều" },
];

export default function LibraryScreen() {
  const router = useRouter();
  const [newBooks, setNewBooks] = useState<Book[]>([]);
  const [updatedBooks, setUpdatedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, []);

  async function fetchBooks() {
    setLoading(true);
    const { data } = await booksApi.list({ orderBy: "created_at", limit: 12 });
    const all = data && data.length > 0 ? data : FAKE_BOOKS;
    setNewBooks(all.slice(0, 6));
    setUpdatedBooks(all.slice(0, 6));
    setLoading(false);
  }

  function BookCard({ item }: { item: Book }) {
    return (
      <TouchableOpacity
        style={styles.bookCard}
        onPress={() =>
          router.push({ pathname: "/book/[id]", params: { id: item.id } })
        }
      >
        <View style={styles.bookCover}>
          {item.cover_url ? (
            <Image source={{ uri: item.cover_url }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverEmoji}>
                {item.tag === "novel" ? "📖" : "📚"}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  }

  function SectionHeader({
    title,
    onMore,
  }: {
    title: string;
    onMore?: () => void;
  }) {
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onMore && (
          <TouchableOpacity onPress={onMore}>
            <Text style={styles.seeMore}>Xem Thêm ▶</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TYT</Text>
        <TouchableOpacity style={styles.filterIconBtn}>
          <Text style={styles.filterIconText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Quick Filter Buttons */}
        <View style={styles.quickFilters}>
          {QUICK_FILTERS.map((f, i) => (
            <TouchableOpacity
              key={i}
              style={styles.quickFilterBtn}
              onPress={() => {
                if (f.route === "trending") {
                  router.push("/trending");
                } else {
                  router.push({
                    pathname: "/category",
                    params: { title: f.label },
                  });
                }
              }}
            >
              <Text style={styles.quickFilterIcon}>{f.icon}</Text>
              <Text style={styles.quickFilterLabel}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mới Đăng */}
        <SectionHeader
          title="Mới đăng"
          onMore={() =>
            router.push({
              pathname: "/category",
              params: { title: "Mới Đăng" },
            })
          }
        />
        <FlatList
          data={newBooks}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id + "new"}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => <BookCard item={item} />}
        />

        {/* Mới Cập Nhật */}
        <SectionHeader
          title="Mới cập nhật"
          onMore={() =>
            router.push({
              pathname: "/category",
              params: { title: "Mới Cập Nhật" },
            })
          }
        />
        <FlatList
          data={updatedBooks}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id + "updated"}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => <BookCard item={item} />}
        />

        {/* Truyện Full - Hoàn */}
        <View style={styles.fullSection}>
          <Text style={styles.sectionTitle}>Truyện Full – Hoàn</Text>
          <View style={styles.fullGrid}>
            {FULL_CATEGORIES.map((cat, i) => (
              <TouchableOpacity
                key={i}
                style={styles.fullCategoryBtn}
                onPress={() =>
                  router.push({
                    pathname: "/category",
                    params: { title: cat.label },
                  })
                }
              >
                <Text style={styles.fullCategoryText}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
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
    paddingTop: 16,
    paddingBottom: 12,
    position: "relative",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  filterIconBtn: { position: "absolute", right: 16, top: 14 },
  filterIconText: { fontSize: 20 },
  quickFilters: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 24,
  },
  quickFilterBtn: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
  },
  quickFilterIcon: { fontSize: 22 },
  quickFilterLabel: { color: "#cccccc", fontSize: 11, textAlign: "center" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { color: "#ffffff", fontSize: 17, fontWeight: "bold" },
  seeMore: { color: "#4a9eff", fontSize: 13 },
  horizontalList: { paddingHorizontal: 16, gap: 12, marginBottom: 24 },
  bookCard: { width: BOOK_CARD_WIDTH },
  bookCover: {
    width: BOOK_CARD_WIDTH,
    height: BOOK_CARD_WIDTH * 1.4,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 6,
  },
  coverImage: { width: "100%", height: "100%", resizeMode: "cover" },
  coverPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1e1e1e",
    alignItems: "center",
    justifyContent: "center",
  },
  coverEmoji: { fontSize: 32 },
  bookTitle: { color: "#cccccc", fontSize: 12, lineHeight: 16 },
  fullSection: { paddingHorizontal: 16, marginBottom: 8 },
  fullGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  fullCategoryBtn: {
    width: "48%",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: "center",
  },
  fullCategoryText: { color: "#ffffff", fontSize: 14, fontWeight: "500" },
});
