import { useCallback, useEffect, useMemo, useState } from "react";

export type MediaKind = "photo" | "video" | "project" | "website" | "document";

export type MediaItem = {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  kind: MediaKind;
  tags: string[];
  image?: string;
  date: string;
  size: string;
  sizeBytes?: number;
  favorite: boolean;
  ratio: "portrait" | "landscape" | "square";
};

const STORAGE_KEY = "wilkaxyz:media-items:v1";
const CHANNEL_NAME = "wilkaxyz:realtime";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

type FirebaseModule = typeof import("firebase/app") & {
  getDatabase: typeof import("firebase/database").getDatabase;
  ref: typeof import("firebase/database").ref;
  onValue: typeof import("firebase/database").onValue;
  set: typeof import("firebase/database").set;
};

let firebasePromise: Promise<FirebaseModule | null> | null = null;
function loadFirebase() {
  if (!hasFirebaseConfig) return Promise.resolve(null);
  if (!firebasePromise) {
    firebasePromise = Promise.all([
      import("firebase/app"),
      import("firebase/database"),
    ])
      .then(([app, database]) => {
        const firebaseApp = app.getApps().length
          ? app.getApp()
          : app.initializeApp(firebaseConfig);
        return {
          ...app,
          getDatabase: () => database.getDatabase(firebaseApp),
          ref: database.ref,
          onValue: database.onValue,
          set: database.set,
        } as FirebaseModule;
      })
      .catch(() => null);
  }
  return firebasePromise;
}

function readLocal(): MediaItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as MediaItem[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(items: MediaItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useRealtimeItems() {
  const [items, setItems] = useState<MediaItem[]>(() =>
    typeof window === "undefined" ? [] : readLocal()
  );
  const [connected, setConnected] = useState(false);
  const channel = useMemo(
    () =>
      typeof window !== "undefined" && "BroadcastChannel" in window
        ? new BroadcastChannel(CHANNEL_NAME)
        : null,
    []
  );

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const localListener = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setItems(readLocal());
    };
    const channelListener = (event: MessageEvent<MediaItem[]>) => {
      if (Array.isArray(event.data)) setItems(event.data);
    };
    window.addEventListener("storage", localListener);
    channel?.addEventListener("message", channelListener);

    loadFirebase().then(firebase => {
      if (!active) return;
      if (firebase) {
        const database = firebase.getDatabase();
        unsubscribe = firebase.onValue(
          firebase.ref(database, "wilkaxyz/items"),
          snapshot => {
            const value = snapshot.val();
            setItems(
              Array.isArray(value)
                ? value
                : value
                  ? (Object.values(value) as MediaItem[])
                  : []
            );
            setConnected(true);
          }
        );
      } else {
        setConnected(true);
      }
    });

    return () => {
      active = false;
      unsubscribe?.();
      window.removeEventListener("storage", localListener);
      channel?.removeEventListener("message", channelListener);
      channel?.close();
    };
  }, [channel]);

  const publish = useCallback(
    async (nextItems: MediaItem[]) => {
      setItems(nextItems);
      writeLocal(nextItems);
      channel?.postMessage(nextItems);
      const firebase = await loadFirebase();
      if (firebase) {
        const database = firebase.getDatabase();
        await firebase.set(firebase.ref(database, "wilkaxyz/items"), nextItems);
      }
    },
    [channel]
  );

  const addItem = useCallback(
    (item: MediaItem) => publish([item, ...items]),
    [items, publish]
  );
  const toggleFavorite = useCallback(
    (id: number) =>
      publish(
        items.map(item =>
          item.id === id ? { ...item, favorite: !item.favorite } : item
        )
      ),
    [items, publish]
  );
  const deleteItem = useCallback(
    (id: number) => publish(items.filter(item => item.id !== id)),
    [items, publish]
  );

  return { items, connected, addItem, toggleFavorite, deleteItem };
}
