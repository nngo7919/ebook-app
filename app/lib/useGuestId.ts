import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GUEST_ID_KEY = "tyt_guest_id";

export function useGuestId() {
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    async function loadGuestId() {
      try {
        let id = await AsyncStorage.getItem(GUEST_ID_KEY);
        if (!id) {
          id = "guest_" + Math.random().toString(36).substring(2, 15);
          await AsyncStorage.setItem(GUEST_ID_KEY, id);
        }
        setGuestId(id);
      } catch (e) {
        console.error("Failed to load/generate guest ID", e);
      }
    }
    loadGuestId();
  }, []);

  return guestId;
}