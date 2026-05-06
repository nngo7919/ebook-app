import { supabase } from "@/lib/supabase";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Linking } from "react-native";
import "react-native-reanimated";

import { AuthProvider } from "@/app/lib/auth";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

// Parse fragment params từ deep link URL (vd: ebook-app://auth/reset-password#access_token=xxx&type=recovery)
function parseFragment(url: string): Record<string, string> {
  const hash = url.split("#")[1] ?? "";
  return Object.fromEntries(new URLSearchParams(hash).entries());
}

function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    async function handleUrl(url: string) {
      const params = parseFragment(url);
      if (params.type === "recovery" && params.access_token) {
        // Set session từ token trong URL trước khi navigate
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token ?? "",
        });
        router.replace("/auth/reset-password" as any);
      }
    }

    // Xử lý khi app đang chạy và nhận deep link
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));

    // Xử lý khi app được mở từ deep link (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    return () => sub.remove();
  }, [router]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <DeepLinkHandler />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
          <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="auth/reset-password" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
          <Stack.Screen name="category" options={{ headerShown: false }} />
          <Stack.Screen name="trending" options={{ headerShown: false }} />
          <Stack.Screen name="book-list" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="book/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="author/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="reader/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="toc/[id]" options={{ headerShown: false }} />
          <Stack.Screen
            name="reader-settings"
            options={{ headerShown: false }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}