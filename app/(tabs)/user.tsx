import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const MENU_SECTIONS = [
  {
    title: "LỊCH SỬ TRÊN TÀI KHOẢN",
    items: [
      { icon: "🕐", label: "Truyện đã xem" },
      { icon: "🤍", label: "Truyện đã thích" },
      { icon: "⬇️", label: "Truyện đã tải" },
      { icon: "🔔", label: "Truyện đã theo dõi" },
      { icon: "👥", label: "Người đang theo dõi" },
    ],
  },
  {
    title: "THÔNG BÁO",
    items: [{ icon: "🔔", label: "Thông báo của tôi" }],
  },
  {
    title: "DANH SÁCH TRUYỆN",
    items: [
      { icon: "📋", label: "Bộ sưu tập của tôi" },
      { icon: "📋", label: "Bộ sưu tập yêu thích" },
      { icon: "📋", label: "Bộ sưu tập cộng đồng TYT" },
    ],
  },
];

export default function UserScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <TouchableOpacity
          style={styles.profile}
          onPress={() => router.push("/profile")}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Người dùng</Text>
            <Text style={styles.profileSub}>TYT - Truyện Online, Offline</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Menu sections */}
        {MENU_SECTIONS.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            {section.items.map((item, ii) => (
              <TouchableOpacity key={ii} style={styles.menuItem}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },

  // Profile
  profile: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#888",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 28 },
  profileInfo: { flex: 1 },
  profileName: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileSub: { color: "#888", fontSize: 13 },

  // Sections
  section: { marginBottom: 8 },
  sectionLabel: {
    color: "#555",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  // Menu items
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  menuIcon: { fontSize: 20, width: 28, textAlign: "center" },
  menuLabel: { flex: 1, color: "#ffffff", fontSize: 16 },
  arrow: { color: "#555", fontSize: 22, fontWeight: "300" },
});
