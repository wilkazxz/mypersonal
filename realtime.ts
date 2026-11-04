import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

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
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
};

type Row = {
  id: number | string;
  title: string;
  subtitle: string | null;
  category: string | null;
  kind: string;
  tags: string[] | null;
  image: string | null;
  date: string | null;
  size: string | null;
  size_bytes: number | null;
  ratio: string | null;
  owner_id: string | null;
  owner_name: string | null;
  owner_email: string | null;
};

const STORAGE_KEY = "wilkaxyz:media-items:v1";
const FAV_KEY = "wilkaxyz:favorites:v1";
const CHANNEL_NAME = "wilkaxyz:realtime";
const BUCKET = "media";
const PUBLIC_MARK = `/storage/v1/object/public/${BUCKET}/`;

const fromRow = (r: Row): MediaItem => ({
  id: Number(r.id),
  title: r.title,
  subtitle: r.subtitle ?? "",
  category: r.category ?? "",
  kind: r.kind as MediaKind,
  tags: r.tags ?? [],
  image: r.image ?? undefined,
  date: r.date ?? "",
  size: r.size ?? "",
  sizeBytes: r.size_bytes ?? undefined,
  favorite: false,
  ratio: (r.ratio as MediaItem["ratio"]) ?? "landscape",
  ownerId: r.owner_id ?? undefined,
  ownerName: r.owner_name ?? undefined,
  ownerEmail: r.owner_email ?? undefined,
});

const today = () =>
  new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

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
function readFavs(): number[] {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useRealtimeItems() {
  const [raw, setRaw] = useState<MediaItem[]>(() =>
    supabase || typeof window === "undefined" ? [] : readLocal()
  );
  const [favs, setFavs] = useState<number[]>(() =>
    typeof window === "undefined" ? [] : readFavs()
  );
  const [connected, setConnected] = useState(!supabase);
  const channel = useMemo(
    () =>
      !supabase && typeof window !== "undefined" && "BroadcastChannel" in window
        ? new BroadcastChannel(CHANNEL_NAME)
        : null,
    []
  );

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("media_items")
      .select("*")
      .order("id", { ascending: false });
    if (!error && data) setRaw((data as Row[]).map(fromRow));
    setConnected(!error);
  }, []);

  useEffect(() => {
    if (supabase) {
      const client = supabase;
      void load();
      const sub = client
        .channel(`media_items_${Math.random().toString(36).slice(2)}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "media_items" },
          () => void load()
        )
        .subscribe();
      return () => {
        void client.removeChannel(sub);
      };
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setRaw(readLocal());
    };
    const onMessage = (e: MessageEvent<MediaItem[]>) => {
      if (Array.isArray(e.data)) setRaw(e.data);
    };
    window.addEventListener("storage", onStorage);
    channel?.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.removeEventListener("message", onMessage);
    };
  }, [load, channel]);

  // favorit = penanda pribadi per perangkat, bukan data publik
  const items = useMemo(
    () => raw.map(item => ({ ...item, favorite: favs.includes(item.id) })),
    [raw, favs]
  );

  const commitLocal = (next: MediaItem[]) => {
    setRaw(next);
    writeLocal(next);
    channel?.postMessage(next);
  };

  const addItem = useCallback(
    async (item: MediaItem) => {
      const stamped = { ...item, date: today() };
      if (!supabase) return commitLocal([stamped, ...raw]);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Login Google dulu untuk upload.");

      let image = stamped.image;
      if (image?.startsWith("data:")) {
        const blob = await (await fetch(image)).blob();
        const ext = (blob.type.split("/")[1] || "png")
          .replace("jpeg", "jpg")
          .split("+")[0];
        const path = `${user.id}/${stamped.id}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, { contentType: blob.type });
        if (upErr) throw upErr;
        image = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      }
      const meta = user.user_metadata || {};
      const { error } = await supabase.from("media_items").insert({
        id: stamped.id,
        title: stamped.title,
        subtitle: stamped.subtitle,
        category: stamped.category,
        kind: stamped.kind,
        tags: stamped.tags,
        image: image ?? null,
        date: stamped.date,
        size: stamped.size,
        size_bytes: stamped.sizeBytes ?? null,
        ratio: stamped.ratio,
        owner_id: user.id,
        owner_name: meta.full_name || meta.name || user.email,
        owner_email: user.email,
      });
      if (error) throw error;
      await load();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [raw, load, channel]
  );

  const updateItem = useCallback(
    async (
      id: number,
      patch: Partial<Pick<MediaItem, "title" | "subtitle" | "category" | "tags">>
    ) => {
      if (!supabase)
        return commitLocal(raw.map(i => (i.id === id ? { ...i, ...patch } : i)));
      const { error } = await supabase
        .from("media_items")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
      await load();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [raw, load, channel]
  );

  const deleteItem = useCallback(
    async (id: number) => {
      if (!supabase) return commitLocal(raw.filter(i => i.id !== id));
      const target = raw.find(i => i.id === id);
      const { error } = await supabase.from("media_items").delete().eq("id", id);
      if (error) throw error;
      const at = target?.image?.indexOf(PUBLIC_MARK) ?? -1;
      if (target?.image && at >= 0) {
        const path = decodeURIComponent(
          target.image.slice(at + PUBLIC_MARK.length)
        );
        await supabase.storage.from(BUCKET).remove([path]);
      }
      await load();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [raw, load, channel]
  );

  const toggleFavorite = useCallback(async (id: number) => {
    setFavs(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { items, connected, addItem, updateItem, toggleFavorite, deleteItem };
}
