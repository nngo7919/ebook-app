import { useAuth } from "@/app/lib/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  books as booksApi,
  chapters as chaptersApi,
  progress as progressApi,
} from "../lib/api";

const PINK = "#e91e8c";
const { width } = Dimensions.get("window");

type Settings = {
  bgColor: string;
  textColor: string;
  fontSize: number;
  lineHeight: number;
  readMode: "scroll" | "page" | "combined";
};

type Chapter = {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
  created_at?: string;
};

const DEFAULT_SETTINGS: Settings = {
  bgColor: "#0d0d0d",
  textColor: "#e0e0e0",
  fontSize: 19,
  lineHeight: 1.6,
  readMode: "combined",
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `ngày ${d.getDate()} thg ${d.getMonth() + 1}, ${d.getFullYear()}`;
}

export default function ReaderScreen() {
  const { id, chapter: chapterParam } = useLocalSearchParams<{
    id: string;
    chapter?: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();

  const [bookTitle, setBookTitle] = useState("");
  const [totalChapters, setTotalChapters] = useState(1);
  const [currentChapter, setCurrentChapter] = useState(
    chapterParam ? parseInt(chapterParam) : 1,
  );
  const [chapterData, setChapterData] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [scrollProgress, setScrollProgress] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const contentHeight = useRef(0);
  const scrollHeight = useRef(0);

  // Load settings
  useEffect(() => {
    AsyncStorage.getItem("reader_settings").then((val) => {
      if (val) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(val) });
    });
  }, []);

  // Load book info
  useEffect(() => {
    loadBook();
  }, [id]);

  // Load chapter
  useEffect(() => {
    loadChapter(currentChapter);
  }, [currentChapter]);

  async function loadBook() {
    const { data } = await booksApi.get(id);
    if (data) {
      setBookTitle(data.title);
      setTotalChapters(data.total_chapters ?? 1);
    }
  }

  async function loadChapter(num: number) {
    setLoading(true);
    scrollRef.current?.scrollTo({ y: 0, animated: false });

    const { data } = await chaptersApi.get(id, num);

    if (data) {
      setChapterData(data);
    } else {
      // Fallback content khi chưa có data
      setChapterData({
        id: `fake-${num}`,
        chapter_number: num,
        title: `Chương ${num}`,
        content: `Lão phu bấm ngón tay tính toán, hiện giờ người đang nằm trên giường xem tiểu thuyết, lại còn nằm nghiêng, có khi điện thoại còn đang sạc pin.\n\nDương Gian, cậu học sinh lớp 12, lúc này đang nằm trong chăn, buồn chán lướt điện thoại. Hắn tiện tay mở một bài viết, bên dưới có rất nhiều bình luận của cư dân mạng.\n\n"Thánh thật sự, chủ thớt đoán trúng phóc luôn."\n\n"Mọi người biết tôi đang đi vệ sinh không?"\n\nDương Gian lắc đầu cười, tiếp tục cuộn xuống đọc thêm. Bên ngoài cửa sổ, tiếng gió thổi xào xạc qua những tán lá xanh.`,
        created_at: new Date().toISOString(),
      });
    }
    setLoading(false);
    setScrollProgress(0);
  }

  function handleScroll(e: any) {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    contentHeight.current = contentSize.height;
    scrollHeight.current = layoutMeasurement.height;
    const progress =
      contentOffset.y / (contentSize.height - layoutMeasurement.height);
    const clamped = Math.min(1, Math.max(0, progress));
    setScrollProgress(clamped);

    // Tự động lưu progress (debounce đơn giản bằng cách chỉ lưu mỗi 5%)
    if (user && Math.round(clamped * 100) % 5 === 0) {
      progressApi.save(user.id, id, currentChapter, clamped * 100);
    }
  }

  const toggleControls = useCallback(() => {
    setShowControls((v) => !v);
  }, []);

  const shortTitle =
    bookTitle.length > 16 ? bookTitle.slice(0, 16) + "..." : bookTitle;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: settings.bgColor }]}
    >
      {/* TOP HEADER */}
      {showControls && (
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
          >
            <Text style={styles.headerX}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {shortTitle}
          </Text>
          <TouchableOpacity
            onPress={() => loadChapter(currentChapter)}
            style={styles.headerBtn}
          >
            <Text style={styles.headerRefresh}>↻</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CONTENT */}
      <TouchableWithoutFeedback onPress={toggleControls}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.center}>
              <Text style={{ color: "#888" }}>Đang tải...</Text>
            </View>
          ) : (
            <>
              <Text
                style={[
                  styles.chapterTitle,
                  {
                    color: settings.textColor,
                    fontSize: settings.fontSize + 3,
                  },
                ]}
              >
                {chapterData?.title}
              </Text>
              {chapterData?.content.split("\n\n").map((para, i) => (
                <Text
                  key={i}
                  style={[
                    styles.paragraph,
                    {
                      color: settings.textColor,
                      fontSize: settings.fontSize,
                      lineHeight: settings.fontSize * settings.lineHeight,
                    },
                  ]}
                >
                  {para.trim()}
                </Text>
              ))}
            </>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* BOTTOM BAR */}
      {showControls && (
        <View style={styles.bottomBar}>
          {/* Chapter info */}
          <View style={styles.chapterInfo}>
            <Text style={styles.chapterInfoTitle} numberOfLines={1}>
              {chapterData?.title}
            </Text>
            <Text style={styles.chapterInfoDate}>
              {formatDate(chapterData?.created_at)}
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressRow}>
            <Text style={styles.progressCount}>
              {currentChapter}/{totalChapters}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${scrollProgress * 100}%` },
                ]}
              />
              <View
                style={[
                  styles.progressThumb,
                  { left: `${scrollProgress * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressPct}>
              {Math.round(scrollProgress * 100)}%
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.ctrlBtn}
              onPress={() =>
                currentChapter > 1 && setCurrentChapter((c) => c - 1)
              }
            >
              <Text
                style={[
                  styles.ctrlIcon,
                  currentChapter <= 1 && styles.ctrlDisabled,
                ]}
              >
                ‹
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ctrlBtn}
              onPress={() =>
                router.push({ pathname: "/reader-settings", params: { id } })
              }
            >
              <Text style={styles.ctrlIcon}>⚙</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ctrlBtn}>
              <Text style={styles.ctrlIcon}>▶</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ctrlBtn}>
              <Text style={styles.ctrlIcon}>🎧</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ctrlBtn}
              onPress={() =>
                router.push({
                  pathname: "/toc/[id]",
                  params: { id, chapter: currentChapter },
                })
              }
            >
              <Text style={styles.ctrlIcon}>≡</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ctrlBtn}
              onPress={() =>
                currentChapter < totalChapters &&
                setCurrentChapter((c) => c + 1)
              }
            >
              <Text
                style={[
                  styles.ctrlIcon,
                  currentChapter >= totalChapters && styles.ctrlDisabled,
                ]}
              >
                ›
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Content
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  chapterTitle: { fontWeight: "bold", marginBottom: 32, lineHeight: 36 },
  paragraph: { marginBottom: 20, textAlign: "justify" },

  // Bottom bar
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: "#0d0d0d",
  },
  chapterInfo: { marginBottom: 6 },
  chapterInfoTitle: { color: "#888", fontSize: 12 },
  chapterInfoDate: { color: "#555", fontSize: 11, marginTop: 1 },

  // Progress
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  progressCount: { color: "#666", fontSize: 12, width: 40 },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: "#2a2a2a",
    borderRadius: 2,
    position: "relative",
    justifyContent: "center",
  },
  progressFill: { height: 3, backgroundColor: PINK, borderRadius: 2 },
  progressThumb: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PINK,
    marginLeft: -9,
    top: -7,
  },
  progressPct: { color: "#666", fontSize: 12, width: 36, textAlign: "right" },

  // Controls
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  ctrlBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlIcon: { color: PINK, fontSize: 22 },
  ctrlDisabled: { color: "#333" },
});
