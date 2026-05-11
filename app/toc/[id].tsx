import { books as booksApi, chapters as chaptersApi } from "@/app/lib/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PINK = "#e91e8c";
const CHAPTERS_PER_PAGE = 14;

type Chapter = {
  id: string;
  chapter_number: number;
  title: string;
  created_at?: string;
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `ngày ${d.getDate()} thg ${d.getMonth() + 1}, ${d.getFullYear()}`;
}

export default function TocScreen() {
  const { id, chapter } = useLocalSearchParams<{
    id: string;
    chapter?: string;
  }>();
  const router = useRouter();

  const [bookTitle, setBookTitle] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const currentChapter = chapter ? parseInt(chapter) : 1;

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);

    // Lấy tên sách
    const { data: book } = await booksApi.get(id);
    if (book) setBookTitle(book.title);

    // Lấy danh sách chương
    const { data } = await chaptersApi.list(id);

    if (data && data.length > 0) {
      setChapters(data as Chapter[]);
      // Nhảy tới page chứa chương hiện tại
      const idx = data.findIndex((c) => c.chapter_number === currentChapter);
      if (idx >= 0) setPage(Math.ceil((idx + 1) / CHAPTERS_PER_PAGE));
    } else {
      // Fake data nếu chưa có chapters
      const fake: Chapter[] = Array.from({ length: 33 }, (_, i) => ({
        id: `fake-${i}`,
        chapter_number: i + 1,
        title: `Chương ${i + 1}`,
        created_at: new Date(Date.now() - i * 86400000 * 2).toISOString(),
      }));
      setChapters(fake);
    }

    setLoading(false);
  }

  const totalPages = Math.ceil(chapters.length / CHAPTERS_PER_PAGE);
  const pageChapters = chapters.slice(
    (page - 1) * CHAPTERS_PER_PAGE,
    page * CHAPTERS_PER_PAGE,
  );

  function goToChapter(chapterNumber: number) {
    router.push({
      pathname: "/reader/[id]",
      params: { id, chapter: chapterNumber },
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
        >
          <Text style={styles.headerX}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {bookTitle || "Mục Lục"}
        </Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => fetchData()}>
          <Text style={styles.headerRefresh}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Chapter list */}
      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={pageChapters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 16 }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const isActive = item.chapter_number === currentChapter;
            return (
              <TouchableOpacity
                style={styles.chapterItem}
                onPress={() => goToChapter(item.chapter_number)}
              >
                <Text
                  style={[
                    styles.chapterTitle,
                    isActive && styles.chapterTitleActive,
                  ]}
                  numberOfLines={2}
                >
                  {item.title || `Chương ${item.chapter_number}`}
                </Text>
                <Text style={styles.chapterDate}>
                  {formatDate(item.created_at)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Pagination */}
      <View style={styles.pagination}>
        {/* First */}
        <TouchableOpacity
          style={styles.pageBtn}
          onPress={() => setPage(1)}
          disabled={page === 1}
        >
          <Text
            style={[styles.pageBtnText, page === 1 && styles.pageBtnDisabled]}
          >
            |‹
          </Text>
        </TouchableOpacity>

        {/* Prev */}
        <TouchableOpacity
          style={styles.pageBtn}
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <Text
            style={[styles.pageBtnText, page === 1 && styles.pageBtnDisabled]}
          >
            ‹
          </Text>
        </TouchableOpacity>

        {/* Current / Total */}
        <Text style={styles.pageInfo}>
          {page} / {totalPages}
        </Text>

        {/* Next */}
        <TouchableOpacity
          style={styles.pageBtn}
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          <Text
            style={[
              styles.pageBtnText,
              page === totalPages && styles.pageBtnDisabled,
            ]}
          >
            ›
          </Text>
        </TouchableOpacity>

        {/* Last */}
        <TouchableOpacity
          style={styles.pageBtn}
          onPress={() => setPage(totalPages)}
          disabled={page === totalPages}
        >
          <Text
            style={[
              styles.pageBtnText,
              page === totalPages && styles.pageBtnDisabled,
            ]}
          >
            ›|
          </Text>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerX: { color: PINK, fontSize: 20, fontWeight: "bold" },
  headerRefresh: { color: PINK, fontSize: 22 },
  headerTitle: {
    flex: 1,
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Chapter item
  chapterItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
  },
  chapterTitle: {
    flex: 1,
    color: "#cccccc",
    fontSize: 15,
    lineHeight: 22,
  },
  chapterTitleActive: {
    color: PINK,
    fontWeight: "bold",
  },
  chapterDate: {
    color: "#555",
    fontSize: 12,
    flexShrink: 0,
  },
  separator: {
    height: 1,
    backgroundColor: "#1a1a1a",
    marginHorizontal: 0,
  },

  // Pagination
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    gap: 8,
  },
  pageBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  pageBtnText: {
    color: PINK,
    fontSize: 20,
    fontWeight: "bold",
  },
  pageBtnDisabled: {
    color: "#333",
  },
  pageInfo: {
    color: PINK,
    fontSize: 16,
    fontWeight: "600",
    minWidth: 70,
    textAlign: "center",
  },
});
