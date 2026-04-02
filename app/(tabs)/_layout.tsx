import { Tabs } from "expo-router";
import { View } from "react-native";

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#818cf8",
          tabBarInactiveTintColor: "#666",
          tabBarStyle: { backgroundColor: "#121212", borderTopColor: "#333" },
          headerStyle: { backgroundColor: "#121212" },
          headerTintColor: "#ffffff",
        }}
      >
        <Tabs.Screen
          name="library"
          options={{ title: "🌐 Library", tabBarLabel: "🌐 Library" }}
        />
        <Tabs.Screen
          name="my-library"
          options={{ title: "📥 My Library", tabBarLabel: "📥 My Library" }}
        />
      </Tabs>
    </View>
  );
}
