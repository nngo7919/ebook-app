import { Tabs } from "expo-router";
import { Text } from "react-native";

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4a9eff",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "#0d0d0d",
          borderTopColor: "#222",
          height: 64,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
          flexDirection: "column",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 2,
        },
        headerStyle: { backgroundColor: "#0d0d0d" },
        headerTintColor: "#ffffff",
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarLabel: "Library",
          tabBarIcon: ({ color }) => <TabIcon emoji="🌐" />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Tìm Kiếm",
          tabBarLabel: "Tìm Kiếm",
          tabBarIcon: ({ color }) => <TabIcon emoji="🔍" />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="my-library"
        options={{
          title: "My Library",
          tabBarLabel: "My Library",
          tabBarIcon: ({ color }) => <TabIcon emoji="📥" />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: "Menu",
          tabBarLabel: "Menu",
          tabBarIcon: ({ color }) => <TabIcon emoji="👤" />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
