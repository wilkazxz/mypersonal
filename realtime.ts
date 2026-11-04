import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export type MediaKind = "photo" | "video" | "project" | "website" | "document";
export type PostComment = { id: string; text: string; authorId?: string; authorName: string; createdAt: number };
export type MediaItem = {
  id: number; title: string; subtitle: string; category: string; kind: MediaKind; tags: string[];
  image?: string; images?: string[]; date: string; size: string; sizeBytes?: number; favorite: boolean;
  ratio: "portrait" | "landscape" | "square"; link?: string; ownerId?: string; ownerName?: string; ownerEmail?: string;
  text?: string; repostOf?: number; likes?: number; likedBy?: string[]; comments?: PostComment[];
};

const COL = "media_items";
const STORAGE_KEY = "wilkaxyz:media-items:v1";
const FAV_KEY = "wilkaxyz:favorites:v1";
const CHANNEL_NAME = "wilkaxyz:realtime";
const MAX_IMAGE_CHARS = 950_000;

const fromDoc = (d: Record<string, any>): MediaItem => ({
  id: Number(d.id), title: d.title ?? "", subtitle: d.subtitle ?? "", category: d.category ?? "",
  kind: (d.kind ?? "photo") as MediaKind, tags: d.tags ?? [], image: d.image ?? undefined, images: d.images ?? undefined,
  text: d.text ?? undefined, repostOf: d.repostOf ?? undefined, date: d.date ?? "", size: d.size ?? "",
  sizeBytes: d.sizeBytes ?? undefined, favorite: false, ratio: d.ratio ?? "landscape", link: d.link ?? undefined,
  ownerId: d.ownerId ?? undefined, ownerName: d.ownerName ?? undefined, ownerEmail: d.ownerEmail ?? undefined,
  likes: d.likes ?? 0, likedBy: d.likedBy ?? [], comments: d.comments ?? [],
});
const today = () => new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
function shrink(src: string, max: number, quality: number): Promise<string> {
  return new Promise(resolve => { const img = new Image(); img.onload = () => { const scale = Math.min(1, max / Math.max(img.width, img.height)); const w = Math.max(1, Math.round(img.width * scale)); const h = Math.max(1, Math.round(img.height * scale)); const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h; const ctx = canvas.getContext("2d"); if (!ctx) return resolve(src); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h); resolve(canvas.toDataURL("image/jpeg", quality)); }; img.onerror = () => resolve(src); img.src = src; });
}
async function prepareImage(src?: string) { if (!src || !src.startsWith("data:image")) return src; let out = await shrink(src, 1100, .78); if (out.length > MAX_IMAGE_CHARS) out = await shrink(src, 800, .6); if (out.length > MAX_IMAGE_CHARS) throw new Error("Gambar terlalu besar, pakai foto yang lebih kecil."); return out; }
function readLocal(): MediaItem[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as MediaItem[]; } catch { return []; } }
function writeLocal(items: MediaItem[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
function readFavs(): number[] { try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; } }

export function useRealtimeItems() {
  const [raw, setRaw] = useState<MediaItem[]>(() => db || typeof window === "undefined" ? [] : readLocal());
  const [favs, setFavs] = useState<number[]>(() => typeof window === "undefined" ? [] : readFavs());
  const [connected, setConnected] = useState(!db);
  const channel = useMemo(() => !db && typeof window !== "undefined" && "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null, []);
  useEffect(() => { if (db) return onSnapshot(query(collection(db, COL), orderBy("id", "desc")), snap => { setRaw(snap.docs.map(d => fromDoc(d.data()))); setConnected(true); }, () => setConnected(false)); const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) setRaw(readLocal()); }; const onMessage = (e: MessageEvent<MediaItem[]>) => { if (Array.isArray(e.data)) setRaw(e.data); }; window.addEventListener("storage", onStorage); channel?.addEventListener("message", onMessage); return () => { window.removeEventListener("storage", onStorage); channel?.removeEventListener("message", onMessage); }; }, [channel]);
  const items = useMemo(() => raw.map(item => ({ ...item, favorite: favs.includes(item.id) })), [raw, favs]);
  const commitLocal = (next: MediaItem[]) => { setRaw(next); writeLocal(next); channel?.postMessage(next); };
  const addItem = useCallback(async (item: MediaItem) => { const stamped = { ...item, date: today(), likes: item.likes ?? 0, comments: item.comments ?? [] }; if (!db) return commitLocal([stamped, ...raw]); const user = auth?.currentUser; if (!user) throw new Error("Login Google dulu untuk upload."); const images = await Promise.all((stamped.images?.length ? stamped.images : stamped.image ? [stamped.image] : []).map(prepareImage)); await setDoc(doc(db, COL, String(stamped.id)), { ...stamped, image: images[0] ?? null, images, ownerId: user.uid, ownerName: user.displayName || user.email || "User", ownerEmail: user.email || "", favorite: undefined, createdAt: Date.now() }); }, [raw, channel]);
  const updateItem = useCallback(async (id: number, patch: Partial<MediaItem>) => { if (!db) return commitLocal(raw.map(i => i.id === id ? { ...i, ...patch } : i)); await updateDoc(doc(db, COL, String(id)), patch); }, [raw, channel]);
  const deleteItem = useCallback(async (id: number) => { if (!db) return commitLocal(raw.filter(i => i.id !== id)); await deleteDoc(doc(db, COL, String(id))); }, [raw, channel]);
  const toggleFavorite = useCallback(async (id: number) => { setFavs(prev => { const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]; localStorage.setItem(FAV_KEY, JSON.stringify(next)); return next; }); }, []);
  const likeItem = useCallback(async (id: number, uid?: string) => { const item = raw.find(i => i.id === id); if (!item) return; const key = uid || "guest"; const liked = (item.likedBy || []).includes(key); const likedBy = liked ? (item.likedBy || []).filter(x => x !== key) : [...(item.likedBy || []), key]; const patch = { likedBy, likes: likedBy.length }; if (!db) return commitLocal(raw.map(i => i.id === id ? { ...i, ...patch } : i)); await updateDoc(doc(db, COL, String(id)), patch); }, [raw, channel]);
  const addComment = useCallback(async (id: number, text: string, author?: { id?: string; name?: string }) => { const item = raw.find(i => i.id === id); if (!item || !text.trim()) return; const comment: PostComment = { id: `${Date.now()}-${Math.random()}`, text: text.trim(), authorId: author?.id, authorName: author?.name || "Pengguna", createdAt: Date.now() }; const comments = [...(item.comments || []), comment]; if (!db) return commitLocal(raw.map(i => i.id === id ? { ...i, comments } : i)); await updateDoc(doc(db, COL, String(id)), { comments }); }, [raw, channel]);
  return { items, connected, addItem, updateItem, toggleFavorite, deleteItem, likeItem, addComment };
}
