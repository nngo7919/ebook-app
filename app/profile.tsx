import { useAuth } from "@/app/lib/auth";
import { useRouter } from "expo-router";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PINK = "#e91e8c";

function Icon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    edit: "✏️",
    list: "☰",
    upload: "⬆️",
    history: "🕐",
    heart: "❤️",
    download: "⬇️",
    logout: "➡️",
    trash: "🗑️",
  };
  return <Text style={styles.iconEmoji}>{icons[type] ?? "•"}</Text>;
}

const SECTIONS = [
  {
    key: "intro",
    items: [{ icon: "edit", label: "Giới thiệu cá nhân", onPress: null }],
  },
  {
    key: "truyen",
    title: "TRUYỆN CỦA TÔI",
    items: [
      { icon: "list", label: "Danh sách", onPress: null },
      {
        icon: "upload",
        label: "Đăng truyện & nhận thưởng (web)",
        onPress: null,
      },
    ],
  },
  {
    key: "lichsu",
    title: "LỊCH SỬ",
    items: [
      {
        icon: "history",
        label: "Truyện đã xem",
        route: "/book-list?type=recent&title=Truyện Đã Xem",
      },
      {
        icon: "heart",
        label: "Truyện đã thích",
        route: "/book-list?type=favorite&title=Truyện Đã Thích",
      },
      {
        icon: "download",
        label: "Truyện đã tải",
        route: "/book-list?type=download&title=Truyện Đã Tải",
      },
    ],
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user } = useAuth();

  const displayName = profile?.display_name ?? user?.email?.split("@")[0] ?? "Người dùng";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  function handlePress(item: any) {
    if (item.route) {
      router.push(item.route);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
        >
          <Text style={styles.headerBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cá Nhân</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() =>
            Alert.alert("Xoá tài khoản", "Chức năng này chưa khả dụng.")
          }
        >
          <Text style={[styles.headerBtnText, { fontSize: 20 }]}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar + Name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{avatarLetter}</Text>
        </View>
        <Text style={styles.userName}>{displayName}</Text>
      </View>

      {/* Menu sections */}
      <View style={styles.menuWrapper}>
        {SECTIONS.map((section) => (
          <View key={section.key} style={styles.section}>
            {section.title && (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            )}
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.menuItem}
                onPress={() => handlePress(item)}
              >
                <View style={styles.menuIconWrap}>
                  <Icon type={item.icon} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </SafeAreaView>
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
    paddingVertical: 12,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtnText: { color: PINK, fontSize: 22, fontWeight: "bold" },
  headerTitle: { color: "#ffffff", fontSize: 17, fontWeight: "bold" },

  // Avatar
  avatarSection: { alignItems: "center", paddingVertical: 28 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#444",
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { color: "#fff", fontSize: 32, fontWeight: "700" },
  userName: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },

  // Sections
  menuWrapper: { paddingHorizontal: 16, gap: 8 },
  section: { marginBottom: 12 },
  sectionTitle: {
    color: "#555",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
    paddingLeft: 4,
  },

  // Items
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#161616",
  },
  menuIconWrap: { width: 28, alignItems: "center" },
  iconEmoji: { fontSize: 20 },
  menuLabel: { flex: 1, color: "#ffffff", fontSize: 16 },
  arrow: { color: "#444", fontSize: 22 },
});