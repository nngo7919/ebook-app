import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

const { width } = Dimensions.get("window");
const CARD_WIDTH = 140;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

type MyBook = {
  id: string;
  title: string;
  author: string;
  tag: string;
  source: "download" | "upload";
  book_id: string;
  cover_url?: string;
};

export default function MyLibraryScreen() {
  const router = useRouter();
  const [recentBooks, setRecentBooks] = useState<MyBook[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<MyBook[]>([]);
  const [downloadedBooks, setDownloadedBooks] = useState<MyBook[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchMyBooks() {
    setLoading(true);
    const { data } = await supabase
      .from("user_library")
      .select("*")
      .eq("user_id", "local-user")
      .order("created_at", { ascending: false });

    const all = data || [];
    setRecentBooks(all.slice(0, 6));
    setFavoriteBooks(all.slice(0, 6));
    setDownloadedBooks(all.filter((b) => b.source === "download").slice(0, 6));
    setLoading(false);
  }

  useEffect(() => {
    fetchMyBooks();
  }, []);

  async function handleUpload() {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".pdf,.epub";
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setUploading(true);
        const { error } = await supabase.from("user_library").insert({
          user_id: "local-user",
          source: "upload",
          title: fileName,
          author: "Không rõ",
          tag: "book",
          file_path: file.name,
        });
        setUploading(false);
        if (error) {
          Alert.alert("Lỗi", error.message);
        } else {
          Alert.alert("✅ Thành công", `Đã thêm "${fileName}"`);
          fetchMyBooks();
        }
      };
      input.click();
    } else {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["application/epub+zip", "application/pdf"],
          copyToCacheDirectory: true,
        });
        if (result.canceled) return;
        const file = result.assets[0];
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setUploading(true);
        const { error } = await supabase.from("user_library").insert({
          user_id: "local-user",
          source: "upload",
          title: fileName,
          author: "Không rõ",
          tag: "book",
          file_path: file.uri,
        });
        setUploading(false);
        if (error) {
          Alert.alert("Lỗi", error.message);
        } else {
          Alert.alert("✅ Thành công", `Đã thêm "${fileName}"`);
          fetchMyBooks();
        }
      } catch {
        setUploading(false);
      }
    }
  }

  function BookCard({ item }: { item: MyBook }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/reader/${item.book_id || item.id}`)}
      >
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
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  }

  function SectionHeader({
    title,
    onPress,
  }: {
    title: string;
    onPress?: () => void;
  }) {
    return (
      <TouchableOpacity style={styles.sectionHeader} onPress={onPress}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionArrow}>›</Text>
      </TouchableOpacity>
    );
  }

  function EmptySection() {
    return (
      <View style={styles.emptySection}>
        <Text style={styles.emptyText}>Chưa có sách nào</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Truyện Trên Thiết Bị - Offline</Text>
        <TouchableOpacity
          style={[styles.uploadBtn, uploading && { opacity: 0.5 }]}
          onPress={handleUpload}
          disabled={uploading}
        >
          <Text style={styles.uploadText}>{uploading ? "..." : "📤"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Đọc Gần Đây */}
        <SectionHeader title="Đọc Gần Đây" />
        {recentBooks.length === 0 ? (
          <EmptySection />
        ) : (
          <FlatList
            data={recentBooks}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id + "recent"}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => <BookCard item={item} />}
          />
        )}

        <View style={styles.divider} />

        {/* Yêu Thích Gần Đây */}
        <SectionHeader title="Yêu Thích Gần Đây" />
        {favoriteBooks.length === 0 ? (
          <EmptySection />
        ) : (
          <FlatList
            data={favoriteBooks}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id + "fav"}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => <BookCard item={item} />}
          />
        )}

        <View style={styles.divider} />

        {/* Tải Gần Đây - Đọc Offline */}
        <SectionHeader title="Tải Gần Đây - Đọc Offline" />
        {downloadedBooks.length === 0 ? (
          <EmptySection />
        ) : (
          <FlatList
            data={downloadedBooks}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id + "dl"}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => <BookCard item={item} />}
          />
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  uploadBtn: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  uploadText: { fontSize: 20 },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },
  sectionArrow: {
    color: "#888",
    fontSize: 22,
    fontWeight: "300",
  },

  // Book cards
  horizontalList: {
    paddingHorizontal: 16,
    gap: 14,
    paddingBottom: 16,
  },
  card: { width: CARD_WIDTH },
  coverWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
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
  coverEmoji: { fontSize: 36 },
  fullBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#2ecc71",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderBottomRightRadius: 6,
  },
  fullBadgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  cardTitle: {
    color: "#cccccc",
    fontSize: 13,
    lineHeight: 18,
  },

  divider: {
    height: 1,
    backgroundColor: "#1a1a1a",
    marginHorizontal: 0,
  },

  emptySection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyText: {
    color: "#555",
    fontSize: 13,
  },
});
