import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

const PINK = "#e91e8c";

type Settings = {
  bgColor: string;
  textColor: string;
  fontSize: number;
  lineHeight: number;
  readMode: "scroll" | "page" | "combined";
  autoScroll: boolean;
  scrollSpeed: number;
  pageFlipTime: number;
};

const DEFAULT_SETTINGS: Settings = {
  bgColor: "#0d0d0d",
  textColor: "#e0e0e0",
  fontSize: 19,
  lineHeight: 1.6,
  readMode: "combined",
  autoScroll: false,
  scrollSpeed: 20,
  pageFlipTime: 25,
};

const BG_OPTIONS = [
  { label: "Auto", bg: "#0d0d0d", text: "#e0e0e0", isAuto: true },
  { bg: "#ffffff", text: "#111111" },
  { bg: "#1a1a1a", text: "#cccccc" },
  { bg: "#f5e6c8", text: "#3d2b1f" },
  { bg: "#f0ddb0", text: "#3d2b1f" },
  { bg: "#111111", text: "#dddddd" },
  { bg: "#f8f8f8", text: "#222222" },
  { bg: "#e8e8e8", text: "#333333" },
];

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function Stepper({
  value,
  onDec,
  onInc,
  display,
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
  display?: string;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperValue}>{display ?? value}</Text>
      <View style={styles.stepperBtns}>
        <TouchableOpacity style={styles.stepperBtn} onPress={onDec}>
          <Text style={styles.stepperBtnText}>−</Text>
        </TouchableOpacity>
        <View style={styles.stepperDivider} />
        <TouchableOpacity style={styles.stepperBtn} onPress={onInc}>
          <Text style={styles.stepperBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ReaderSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    AsyncStorage.getItem("reader_settings").then((val) => {
      if (val) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(val) });
    });
  }, []);

  function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    AsyncStorage.setItem("reader_settings", JSON.stringify(next));
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
        <Text style={styles.headerTitle}>Thiết Lập Giao Diện</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── MÀU NỀN ── */}
        <SectionLabel title="MÀU NỀN" />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Màu Nền</Text>
          <View style={styles.bgGrid}>
            {BG_OPTIONS.map((opt, i) => {
              const isSelected = settings.bgColor === opt.bg;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.bgSwatch,
                    { backgroundColor: opt.bg },
                    isSelected && styles.bgSwatchSelected,
                  ]}
                  onPress={() =>
                    update({ bgColor: opt.bg, textColor: opt.text })
                  }
                >
                  {opt.isAuto && (
                    <Text
                      style={[
                        styles.bgSwatchLabel,
                        { color: isSelected ? PINK : "#888" },
                      ]}
                    >
                      Auto
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── KÍCH THƯỚC CHỮ ── */}
        <SectionLabel title="KÍCH THƯỚC CHỮ" />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Kích Thước</Text>
          <Stepper
            value={settings.fontSize}
            onDec={() =>
              update({ fontSize: Math.max(12, settings.fontSize - 1) })
            }
            onInc={() =>
              update({ fontSize: Math.min(32, settings.fontSize + 1) })
            }
          />
        </View>

        {/* ── KÍCH THƯỚC DÒNG ── */}
        <SectionLabel title="KÍCH THƯỚC DÒNG" />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Kích Thước</Text>
          <Stepper
            value={settings.lineHeight}
            display={settings.lineHeight.toFixed(1)}
            onDec={() =>
              update({
                lineHeight: Math.max(
                  1.0,
                  parseFloat((settings.lineHeight - 0.1).toFixed(1)),
                ),
              })
            }
            onInc={() =>
              update({
                lineHeight: Math.min(
                  3.0,
                  parseFloat((settings.lineHeight + 0.1).toFixed(1)),
                ),
              })
            }
          />
        </View>

        {/* ── KIỂU ĐỌC ── */}
        <SectionLabel title="KIỂU ĐỌC" />
        {(["scroll", "page", "combined"] as const).map((mode) => {
          const labels = {
            scroll: "Cuộn Dọc",
            page: "Lật Trang",
            combined: "Kết Hợp",
          };
          const isActive = settings.readMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={styles.row}
              onPress={() => update({ readMode: mode })}
            >
              <Text style={styles.rowLabel}>{labels[mode]}</Text>
              {isActive && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          );
        })}

        {/* ── TỰ ĐỘNG CUỘN ── */}
        <SectionLabel title="TỰ ĐỘNG CUỘN" />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Tự Động Cuộn Khi Đọc</Text>
          <Switch
            value={settings.autoScroll}
            onValueChange={(v) => update({ autoScroll: v })}
            trackColor={{ false: "#333", true: PINK }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Tốc Độ Cuộn Dọc</Text>
          <Stepper
            value={settings.scrollSpeed}
            onDec={() =>
              update({ scrollSpeed: Math.max(1, settings.scrollSpeed - 1) })
            }
            onInc={() =>
              update({ scrollSpeed: Math.min(100, settings.scrollSpeed + 1) })
            }
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Thời Gian Lật Trang</Text>
          <Stepper
            value={settings.pageFlipTime}
            onDec={() =>
              update({ pageFlipTime: Math.max(5, settings.pageFlipTime - 1) })
            }
            onInc={() =>
              update({ pageFlipTime: Math.min(120, settings.pageFlipTime + 1) })
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },

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
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
  },

  sectionLabel: {
    color: "#555",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#161616",
  },
  rowLabel: { color: "#ffffff", fontSize: 16 },
  checkmark: { color: PINK, fontSize: 20, fontWeight: "bold" },

  // Bg swatches
  bgGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-end",
    maxWidth: 220,
  },
  bgSwatch: {
    width: 40,
    height: 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  bgSwatchSelected: { borderWidth: 2, borderColor: PINK },
  bgSwatchLabel: { fontSize: 11, fontWeight: "600" },

  // Stepper
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepperValue: {
    color: "#fff",
    fontSize: 16,
    minWidth: 36,
    textAlign: "right",
  },
  stepperBtns: {
    flexDirection: "row",
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    overflow: "hidden",
  },
  stepperBtn: {
    width: 40,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: { color: "#fff", fontSize: 20 },
  stepperDivider: { width: 1, backgroundColor: "#333" },
});
