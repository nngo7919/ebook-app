import { useAuth } from "@/app/lib/auth";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PINK = "#e91e8c";

const MENU_SECTIONS = [
  {
    title: "LỊCH SỬ TRÊN TÀI KHOẢN",
    items: [
      {
        icon: "🕐",
        label: "Truyện đã xem",
        route: "/book-list?type=recent&title=Truyện Đã Xem",
      },
      {
        icon: "🤍",
        label: "Truyện đã thích",
        route: "/book-list?type=favorite&title=Truyện Đã Thích",
      },
      {
        icon: "⬇️",
        label: "Truyện đã tải",
        route: "/book-list?type=download&title=Truyện Đã Tải",
      },
      { icon: "🔔", label: "Truyện đã theo dõi", route: null },
      { icon: "👥", label: "Người đang theo dõi", route: null },
    ],
  },
  {
    title: "THÔNG BÁO",
    items: [{ icon: "🔔", label: "Thông báo của tôi", route: null }],
  },
  {
    title: "DANH SÁCH TRUYỆN",
    items: [
      { icon: "📋", label: "Bộ sưu tập của tôi", route: null },
      { icon: "📋", label: "Bộ sưu tập yêu thích", route: null },
      { icon: "📋", label: "Bộ sưu tập cộng đồng TYT", route: null },
    ],
  },
];

export default function UserScreen() {
  const router = useRouter();
  const { user, profile, signOut, isGuest } = useAuth();

  const displayName = isGuest
    ? "Khách"
    : (profile?.display_name ?? user?.email?.split("@")[0] ?? "Người dùng");
  const avatarLetter = isGuest ? "K" : displayName.charAt(0).toUpperCase();
  const isLoggedIn = !!user && !isGuest;

  async function handleLogout() {
    await signOut();
    router.replace("/auth/login" as any);
  }

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
          onPress={() =>
            isLoggedIn ? router.push("/profile" as any) : router.push("/auth/login" as any)
          }
        >
          <View style={[styles.avatar, isLoggedIn && styles.avatarLoggedIn, isGuest && styles.avatarGuest]}>
            {(isLoggedIn || isGuest) ? (
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            ) : (
              <Text style={styles.avatarText}>👤</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileSub}>
              {isGuest
                ? "Đang dùng chế độ khách"
                : isLoggedIn
                  ? user?.email
                  : "Đăng nhập để lưu tiến độ đọc"}
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Banner cho guest — khuyến khích đăng nhập */}
        {isGuest && (
          <View style={styles.guestBanner}>
            <Text style={styles.guestBannerTitle}>Bạn đang dùng chế độ khách</Text>
            <Text style={styles.guestBannerSub}>
              Đăng nhập để lưu tiến độ đọc, yêu thích và lịch sử trên tất cả thiết bị.
            </Text>
            <TouchableOpacity
              style={styles.guestBannerBtn}
              onPress={() => router.push("/auth/login" as any)}
            >
              <Text style={styles.guestBannerBtnText}>Đăng nhập / Đăng ký</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Login button cho chưa đăng nhập */}
        {!isLoggedIn && !isGuest && (
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push("/auth/login" as any)}
          >
            <Text style={styles.loginBtnText}>Đăng nhập / Đăng ký</Text>
          </TouchableOpacity>
        )}

        {/* Menu sections — ẩn "Lịch sử trên tài khoản" cho guest */}
        {MENU_SECTIONS.filter(s =>
          isGuest ? s.title !== "LỊCH SỬ TRÊN TÀI KHOẢN" : true
        ).map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            {section.items.map((item, ii) => (
              <TouchableOpacity
                key={ii}
                style={styles.menuItem}
                onPress={() =>
                  item.route ? router.push(item.route as any) : null
                }
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Logout */}
        {isLoggedIn && (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>➡️ Đăng xuất</Text>
          </TouchableOpacity>
        )}

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
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLoggedIn: { backgroundColor: PINK },
  avatarText: { fontSize: 28 },
  avatarLetter: { fontSize: 26, color: "#fff", fontWeight: "800" },
  profileInfo: { flex: 1 },
  profileName: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileSub: { color: "#888", fontSize: 13 },

  avatarGuest: { backgroundColor: "#555" },

  // Guest banner
  guestBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  guestBannerTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  guestBannerSub: {
    color: "#888",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  guestBannerBtn: {
    backgroundColor: PINK,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  guestBannerBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  loginBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: PINK,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  loginBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

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

  // Logout
  logoutBtn: {
  marginHorizontal: 16,
  marginTop: 8,
  paddingVertical: 16,
  borderTopWidth: 1,
  borderTopColor: "#1a1a1a",
},
  logoutText: { color: "#e74c3c", fontSize: 16 },
});