import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "./auth";
import { useSite, useUsers } from "./site";
import { useRealtimeItems } from "./realtime";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  Database,
  FileArchive,
  FileCode2,
  FileImage,
  FileText,
  HardDrive,
  LayoutDashboard,
  LockKeyhole,
  MoreHorizontal,
  Server,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  Video,
  Wifi,
  X,
  LogOut,
  Pencil,
  Trash2,
} from "lucide-react";

const activityLog: Array<{
  icon: typeof Upload;
  title: string;
  meta: string;
  time: string;
  tone: string;
}> = [];

const contentRows: Array<{
  name: string;
  type: string;
  collection: string;
  updated: string;
  size: string;
  icon: typeof FileImage;
}> = [];

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  trend?: string;
}) {
  return (
    <div className="admin-metric">
      <div className="admin-metric__top">
        <span className="admin-icon">
          <Icon size={17} />
        </span>
        {trend && <span className="metric-trend">{trend}</span>}
      </div>
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

export default function Admin() {
  const { user, isAdmin, loading, signInWithGoogle, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("Overview");
  const [showNotice, setShowNotice] = useState(true);
  const { items, connected, deleteItem, updateItem } = useRealtimeItems();
  const { site, save: saveSite } = useSite();
  const users = useUsers(isAdmin);
  const [siteName, setSiteName] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const photos = items.filter(item => item.category === "Photos").length;
  const videos = items.filter(item => item.category === "Videos").length;
  const projects = items.filter(item => item.category === "Projects").length;
  const storageBytes = items.reduce(
    (total, item) => total + (item.sizeBytes || 0),
    0
  );
  const formatBytes = (bytes: number) =>
    bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : "0 B";

  if (loading)
    return (
      <div className="admin-gate">
        <div className="admin-loader">
          <span className="status-dot" /> Checking secure session
        </div>
      </div>
    );
  if (!user || !isAdmin)
    return (
      <div className="admin-gate">
        <div className="admin-gate__card">
          <div className="admin-gate__mark">
            <LockKeyhole size={24} />
          </div>
          <span className="eyebrow">WILKAXYZ / ADMIN</span>
          <h1>
            Private space.
            <br />
            <span>Authorized only.</span>
          </h1>
          <p>
            {user
              ? `${user.email} bukan akun admin. Keluar lalu masuk dengan akun Google admin.`
              : "Console ini hanya untuk admin. Masuk dengan akun Google admin untuk mengelola konten."}
          </p>
          <button
            className="primary-button primary-button--full"
            onClick={() => (user ? void signOut() : void signInWithGoogle("/admin"))}
          >
            <LockKeyhole size={16} /> {user ? "Keluar & ganti akun" : "Masuk dengan Google"}
          </button>
          <Link href="/" className="back-link">
            <ArrowLeft size={15} /> Back to archive
          </Link>
        </div>
      </div>
    );

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="brand-orbit">
            <span />
          </span>
          <strong>WILKAXYZ</strong>
          <small>ADMIN CONSOLE</small>
        </div>
        <div className="admin-user">
          <div className="avatar avatar--lime">
            {user.name?.charAt(0) || "W"}
          </div>
          <div>
            <strong>{user.name || "Owner"}</strong>
            <span>Administrator</span>
          </div>
          <button className="icon-button" onClick={() => void signOut()} aria-label="Sign out">
            <LogOut size={14} />
          </button>
        </div>
        <span className="admin-nav-label">CONTROL ROOM</span>
        <nav className="admin-nav">
          <button
            className={activeTab === "Overview" ? "is-active" : ""}
            onClick={() => setActiveTab("Overview")}
          >
            <LayoutDashboard size={17} /> Overview
          </button>
          <button
            className={activeTab === "Content" ? "is-active" : ""}
            onClick={() => setActiveTab("Content")}
          >
            <FileArchive size={17} /> Content manager <span>{items.length}</span>
          </button>
          <button
            className={activeTab === "Branding" ? "is-active" : ""}
            onClick={() => setActiveTab("Branding")}
          >
            <Settings size={17} /> Branding
          </button>
          <button
            className={activeTab === "Users" ? "is-active" : ""}
            onClick={() => setActiveTab("Users")}
          >
            <Users size={17} /> Users <span>{users.length}</span>
          </button>
        </nav>
        <div className="admin-sidebar__bottom">
                    <Link href="/" className="back-link">
            <ArrowLeft size={15} /> Return to archive
          </Link>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="eyebrow">WILKAXYZ / CONTROL ROOM</span>
            <h1>{activeTab}</h1>
          </div>
          <div className="admin-topbar__actions">
            <span className="admin-online">
              <span className="status-dot" />{" "}
              {connected ? "Live sync active" : "Connecting…"}
            </span>
            <button className="icon-button">
              <Settings size={18} />
            </button>
            <div className="avatar avatar--dark">
              {user.name?.charAt(0) || "W"}
            </div>
          </div>
        </header>
        {showNotice && (
          <div className="admin-notice">
            <div>
              <span className="notice-icon">
                <ShieldCheck size={16} />
              </span>
              <span>
                <strong>Security check passed.</strong> Your account is
                protected with role-based access.
              </span>
            </div>
            <button
              className="icon-button"
              onClick={() => setShowNotice(false)}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {activeTab === "Overview" && (<>
        <section className="admin-metrics">
          <Metric
            label="TOTAL UPLOADS"
            value={String(items.length)}
            detail={items.length ? "Live collection" : "No files yet"}
            icon={FileArchive}
          />
          <Metric
            label="PHOTOS"
            value={String(photos)}
            detail={photos ? "In collection" : "No photos yet"}
            icon={FileImage}
          />
          <Metric
            label="VIDEOS"
            value={String(videos)}
            detail={videos ? "In collection" : "No videos yet"}
            icon={Video}
          />
          <Metric
            label="PROJECTS"
            value={String(projects)}
            detail={projects ? "In collection" : "No projects yet"}
            icon={FileCode2}
          />
          <Metric
            label="STORAGE"
            value={formatBytes(storageBytes)}
            detail="of 10 GB capacity"
            icon={HardDrive}
          />
        </section>
        <section className="admin-overview-grid">
          <div className="admin-panel status-panel">
            <div className="admin-panel__head">
              <div>
                <span className="eyebrow">SYSTEM MONITOR</span>
                <h2>Waiting for telemetry.</h2>
              </div>
              <button className="panel-action">
                <MoreHorizontal size={18} />
              </button>
            </div>
            <div className="status-list">
              <StatusRow
                label="Website availability"
                detail="Monitoring starts after publish"
                value="Pending"
                state="Not measured"
                icon={Wifi}
              />
              <StatusRow
                label="Application server"
                detail="Primary instance"
                value="Pending"
                state="Not measured"
                icon={Server}
              />
              <StatusRow
                label="Database"
                detail="Managed project database"
                value="Pending"
                state="Not measured"
                icon={Database}
              />
              <StatusRow
                label="Storage capacity"
                detail="No uploaded files"
                value="0%"
                state="Available"
                icon={HardDrive}
              />
            </div>
            <div className="uptime-chart uptime-chart--empty">
              <div className="chart-meta">
                <span>UPTIME HISTORY</span>
                <strong>—</strong>
              </div>
              <div className="chart-empty-message">
                No monitoring data has been collected yet.
              </div>
            </div>
          </div>
          <div className="admin-panel activity-panel">
            <div className="admin-panel__head">
              <div>
                <span className="eyebrow">RECENT ACTIVITY</span>
                <h2>No movements yet</h2>
              </div>
              <button className="text-button">
                View all <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="activity-empty">
              <Activity size={21} />
              <p>Uploads, edits, login, and delete events will appear here.</p>
            </div>
            <button className="secondary-button secondary-button--full" onClick={() => setActiveTab("Users")}>
              <Users size={15} /> View users
            </button>
          </div>
        </section>
        </>)}
        {activeTab === "Content" && (
        <section className="admin-panel content-panel">
          <div className="admin-panel__head">
            <div>
              <span className="eyebrow">CONTENT MANAGEMENT</span>
              <h2>
                {items.length
                  ? `${items.length} published item${items.length === 1 ? "" : "s"}`
                  : "No content yet"}
              </h2>
            </div>
            <div className="content-actions">
              <button className="secondary-button">
                <ChevronDown size={15} /> All types
              </button>
              <Link href="/upload" className="primary-button">
                <Upload size={15} /> Upload new
              </Link>
            </div>
          </div>
          <div className="content-table">
            {items.length ? (
              items.slice(0, 50).map(item => (
                <div className="content-table__row" key={item.id}>
                  <span className="content-name">
                    <span className="file-icon">
                      <FileArchive size={15} />
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <span>
                        {item.category} · {item.date}
                      </span>
                    </span>
                  </span>
                  <span>{item.ownerName ? `by ${item.ownerName}` : item.subtitle}</span>
                  <span>{item.size}</span>
                  <span className="status-row__value">
                    <strong>Published</strong>
                  </span>
                  <span className="row-actions">
                    <button
                      className="table-more"
                      aria-label={`Rename ${item.title}`}
                      onClick={() => {
                        const t = window.prompt("Ubah judul", item.title);
                        if (t && t.trim())
                          void updateItem(item.id, { title: t.trim() });
                      }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="table-more"
                      aria-label={`Delete ${item.title}`}
                      onClick={() => {
                        if (window.confirm(`Hapus "${item.title}"?`))
                          void deleteItem(item.id);
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </span>
                </div>
              ))
            ) : (
              <div className="content-empty">
                <FileArchive size={22} />
                <p>Your uploaded files will appear in the collection index.</p>
              </div>
            )}
          </div>
        </section>
        )}
        {activeTab === "Users" && (
          <section className="admin-panel content-panel">
            <div className="admin-panel__head">
              <div>
                <span className="eyebrow">REGISTERED USERS</span>
                <h2>{users.length ? `${users.length} user terdaftar` : "Belum ada user"}</h2>
              </div>
            </div>
            <div className="user-list">
              {users.map(u => (
                <div className="user-row" key={u.uid}>
                  <span className="avatar avatar--lime">
                    {u.photo ? <img src={u.photo} alt="" referrerPolicy="no-referrer" /> : (u.name || u.email).charAt(0).toUpperCase()}
                  </span>
                  <div className="user-row__info">
                    <strong>{u.name || "(tanpa nama)"}</strong>
                    <span>{u.email}</span>
                  </div>
                  <div className="user-row__meta">
                    <span>{items.filter(i => i.ownerId === u.uid).length} upload</span>
                    <small>
                      Login terakhir {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-"}
                    </small>
                  </div>
                </div>
              ))}
              {!users.length && <p className="muted-note">User akan muncul di sini setelah login Google pertama kali.</p>}
            </div>
          </section>
        )}
        {activeTab === "Branding" && (
          <section className="admin-panel content-panel">
            <div className="admin-panel__head">
              <div>
                <span className="eyebrow">BRANDING</span>
                <h2>Nama dan ikon situs</h2>
              </div>
            </div>
            <div className="branding-form">
              <div className="branding-preview">
                {iconFile ? <img src={URL.createObjectURL(iconFile)} alt="Ikon baru" /> : site.icon ? <img src={site.icon} alt="Ikon saat ini" /> : <span>W</span>}
              </div>
              <label>
                <span>Nama situs</span>
                <input defaultValue={site.name} key={site.name} onChange={e => setSiteName(e.target.value)} placeholder="WILKAXYZ" />
              </label>
              <label>
                <span>Ikon (gambar persegi, otomatis dipotong 192×192)</span>
                <input type="file" accept="image/*" onChange={e => setIconFile(e.target.files?.[0] || null)} />
              </label>
              <button
                className="primary-button"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  setSavedMsg("");
                  try {
                    await saveSite(siteName || site.name, iconFile);
                    setIconFile(null);
                    setSavedMsg("Tersimpan. Perubahan langsung tampil di semua perangkat.");
                  } catch (err: any) {
                    setSavedMsg(`Gagal: ${err?.message || "coba lagi"}`);
                  }
                  setSaving(false);
                }}
              >
                {saving ? "Menyimpan…" : "Simpan perubahan"}
              </button>
              {savedMsg && <p className="muted-note">{savedMsg}</p>}
              <p className="muted-note">
                Ikon baru langsung dipakai di tab browser, logo, dan saat user menambahkan ke layar utama iPhone.
                Ikon aplikasi yang sudah terpasang di Android/komputer tetap memakai ikon bawaan.
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function StatusRow({
  label,
  detail,
  value,
  state,
  icon: Icon,
}: {
  label: string;
  detail: string;
  value: string;
  state: string;
  icon: typeof Wifi;
}) {
  return (
    <div className="status-row">
      <span className="status-row__icon">
        <Icon size={17} />
      </span>
      <div>
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
      <div className="status-row__value">
        <strong>{value}</strong>
        <span>
          <i className="status-dot" /> {state}
        </span>
      </div>
    </div>
  );
}
