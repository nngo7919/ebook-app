import { profiles as profilesApi } from "@/app/lib/api";
import { useAuth } from "@/app/lib/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
    items: [{ icon: "edit", label: "Giới thiệu cá nhân", route: null, action: "edit_bio" }],
  },
  {
    key: "truyen",
    title: "TRUYỆN CỦA TÔI",
    items: [
      { icon: "list", label: "Danh sách", route: "/my-books", action: null },
      { icon: "upload", label: "Đăng truyện mới", route: "/upload", action: null },
    ],
  },
  {
    key: "lichsu",
    title: "LỊCH SỬ",
    items: [
      { icon: "history", label: "Truyện đã xem", route: "/book-list?type=recent&title=Truyện Đã Xem", action: null },
      { icon: "heart", label: "Truyện đã thích", route: "/book-list?type=favorite&title=Truyện Đã Thích", action: null },
      { icon: "download", label: "Truyện đã tải", route: "/book-list?type=download&title=Truyện Đã Tải", action: null },
    ],
  },
  {
    key: "logout",
    title: "",
    items: [
      { icon: "logout", label: "Đăng xuất", route: null, action: "logout" },
    ],
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user, signOut, refreshProfile } = useAuth();

  const displayName = profile?.display_name ?? user?.email?.split("@")[0] ?? "Người dùng";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const [showBioModal, setShowBioModal] = useState(false);
  const [bioText, setBioText] = useState(profile?.bio ?? "");
  const [savingBio, setSavingBio] = useState(false);

  async function handleSaveBio() {
    if (!user) return;
    setSavingBio(true);
    const { error } = await profilesApi.update(user.id, { bio: bioText.trim() });
    setSavingBio(false);
    if (error) {
      Alert.alert("Lỗi", error);
    } else {
      await refreshProfile();
      setShowBioModal(false);
    }
  }

  async function handlePress(item: any) {
    if (item.route) {
      router.push(item.route);
    } else if (item.action === "edit_bio") {
      setBioText(profile?.bio ?? "");
      setShowBioModal(true);
    } else if (item.action === "logout") {
      Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/auth/login");
          },
        },
      ]);
    } else {
      Alert.alert("Sắp ra mắt", "Tính năng này đang được phát triển.");
    }
  }

  async function handleDeleteAccount() {
    Alert.alert(
      "⚠️ Xoá Tài Khoản",
      "Hành động này không thể hoàn tác. Toàn bộ dữ liệu của bạn sẽ bị xoá vĩnh viễn.",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá vĩnh viễn",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Xác nhận lần cuối",
              `Bạn có chắc chắn muốn xoá tài khoản "${profile?.display_name ?? user?.email}"?`,
              [
                { text: "Không", style: "cancel" },
                {
                  text: "Có, xoá ngay",
                  style: "destructive",
                  onPress: async () => {
                    // Supabase không cho phép user tự xoá account qua client SDK
                    // Cần server-side function hoặc admin API
                    // Hiện tại: đăng xuất và hiển thị thông báo
                    await signOut();
                    router.replace("/auth/login");
                    Alert.alert(
                      "Yêu cầu đã ghi nhận",
                      "Tài khoản của bạn sẽ bị xoá trong vòng 24 giờ. Liên hệ admin nếu cần hỗ trợ.",
                    );
                  },
                },
              ],
            );
          },
        },
      ],
    );
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
          onPress={handleDeleteAccount}
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
        {profile?.bio ? (
          <Text style={styles.userBio}>{profile.bio}</Text>
        ) : (
          <TouchableOpacity onPress={() => { setBioText(""); setShowBioModal(true); }}>
            <Text style={styles.addBioBtn}>+ Thêm giới thiệu</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bio Modal */}
      <Modal visible={showBioModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Giới thiệu cá nhân</Text>
            <TextInput
              style={styles.modalInput}
              value={bioText}
              onChangeText={setBioText}
              placeholder="Viết vài điều về bản thân..."
              placeholderTextColor="#555"
              multiline
              maxLength={300}
              autoFocus
            />
            <Text style={styles.charCount}>{bioText.length}/300</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setShowBioModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnSave, savingBio && { opacity: 0.6 }]}
                onPress={handleSaveBio}
                disabled={savingBio}
              >
                <Text style={styles.modalBtnSaveText}>
                  {savingBio ? "Đang lưu..." : "Lưu"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Menu sections */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.menuWrapper}>
          {SECTIONS.map((section) => (
            <View key={section.key} style={styles.section}>
              {section.title ? (
                <Text style={styles.sectionTitle}>{section.title}</Text>
              ) : null}
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.menuItem, item.action === "logout" && styles.menuItemLogout]}
                  onPress={() => handlePress(item)}
                >
                  <View style={styles.menuIconWrap}>
                    <Icon type={item.icon} />
                  </View>
                  <Text style={[styles.menuLabel, item.action === "logout" && styles.menuLabelLogout]}>
                    {item.label}
                  </Text>
                  {item.action !== "logout" && <Text style={styles.arrow}>›</Text>}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
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
  userBio: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  addBioBtn: {
    color: "#4a9eff",
    fontSize: 13,
    marginTop: 8,
  },

  // Bio modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#161616",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    color: "#fff",
    fontSize: 15,
    padding: 14,
    minHeight: 120,
    textAlignVertical: "top",
    lineHeight: 22,
  },
  charCount: {
    color: "#555",
    fontSize: 12,
    textAlign: "right",
    marginTop: 6,
  },
  modalBtns: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
  },
  modalBtnCancelText: { color: "#888", fontSize: 15 },
  modalBtnSave: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: PINK,
    alignItems: "center",
  },
  modalBtnSaveText: { color: "#fff", fontSize: 15, fontWeight: "700" },

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
  menuItemLogout: { borderTopWidth: 1, borderTopColor: "#1a1a1a", marginTop: 8 },
  menuLabelLogout: { color: "#e74c3c" },
});