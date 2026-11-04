import { useCallback, useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export type Site = { name: string; icon?: string };
export type RegisteredUser = {
  uid: string;
  name: string;
  email: string;
  photo?: string;
  createdAt?: number;
  lastLoginAt?: number;
};

const DEFAULT: Site = { name: "WILKAXYZ" };

function setLink(rel: string, href: string) {
  let l = document.querySelector<HTMLLinkElement>(`link[rel='${rel}']`);
  if (!l) {
    l = document.createElement("link");
    l.rel = rel;
    document.head.appendChild(l);
  }
  l.type = "image/png";
  l.href = href;
}

function squareIcon(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = 192;
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = s;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas tidak tersedia"));
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, s, s);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("File gambar tidak bisa dibaca"));
    img.src = url;
  });
}

export function useSite() {
  const [site, setSite] = useState<Site>(DEFAULT);
  useEffect(() => {
    if (!db) return;
    return onSnapshot(
      doc(db, "settings", "site"),
      snap => {
        const d = snap.data();
        const next: Site = { name: d?.name || DEFAULT.name, icon: d?.icon || undefined };
        setSite(next);
        document.title = next.name;
        if (next.icon) {
          setLink("icon", next.icon);
          setLink("apple-touch-icon", next.icon);
        }
      },
      () => {}
    );
  }, []);

  const save = useCallback(async (name: string, iconFile?: File | null) => {
    if (!db) throw new Error("Firebase belum aktif");
    const data: Record<string, unknown> = {
      name: name.trim() || DEFAULT.name,
      updatedAt: Date.now(),
    };
    if (iconFile) data.icon = await squareIcon(iconFile);
    await setDoc(doc(db, "settings", "site"), data, { merge: true });
  }, []);

  return { site, save };
}

export function useUsers(enabled: boolean) {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  useEffect(() => {
    if (!db || !enabled) return;
    return onSnapshot(
      query(collection(db, "users"), orderBy("lastLoginAt", "desc")),
      snap => setUsers(snap.docs.map(d => d.data() as RegisteredUser)),
      () => {}
    );
  }, [enabled]);
  return users;
}
