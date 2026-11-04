import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, authEnabled } from "./auth";
import type { LucideIcon } from "lucide-react";
import { useRealtimeItems, type MediaItem } from "./realtime";
import {
  Archive,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Compass,
  FileArchive,
  FileCode2,
  FileText,
  FolderKanban,
  Grid2X2,
  Heart,
  Image as ImageIcon,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  Upload,
  Video,
  X,
  Zap,
  LogOut,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/", icon: Compass },
  { label: "My Gallery", href: "/gallery", icon: Grid2X2 },
  { label: "My Photos", href: "/photos", icon: ImageIcon },
  { label: "My Videos", href: "/videos", icon: Video },
  { label: "My Projects", href: "/projects", icon: FolderKanban },
  { label: "My Websites", href: "/websites", icon: FileCode2 },
  { label: "Favorites", href: "/favorites", icon: Heart },
  { label: "Collections", href: "/collections", icon: Archive },
];

const FILTERS = ["All items", "Photos", "Videos", "Projects", "Websites"];

const PAGE_META: Record<
  string,
  { eyebrow: string; title: string; description: string }
> = {
  "/": {
    eyebrow: "PERSONAL DIGITAL COLLECTION",
    title: "Your archive,\nin orbit.",
    description:
      "A calm place for the things you make, keep, and come back to.",
  },
  "/gallery": {
    eyebrow: "MY GALLERY",
    title: "Everything worth\nkeeping close.",
    description: "Browse every asset in one visual stream.",
  },
  "/photos": {
    eyebrow: "MY PHOTOS",
    title: "Still frames,\nsoftly collected.",
    description: "Your visual notes, references, and favorite moments.",
  },
  "/videos": {
    eyebrow: "MY VIDEOS",
    title: "Motion with\na memory.",
    description: "Short films, captures, and ideas in motion.",
  },
  "/projects": {
    eyebrow: "MY PROJECTS",
    title: "Builds in\nprogress.",
    description: "The work behind the work, kept beautifully organized.",
  },
  "/websites": {
    eyebrow: "MY WEBSITES",
    title: "Small sites,\nbig intent.",
    description: "Your web experiments and digital homes.",
  },
  "/favorites": {
    eyebrow: "FAVORITES",
    title: "The ones you\ncome back to.",
    description: "A focused shelf for the work that still sparks something.",
  },
  "/collections": {
    eyebrow: "COLLECTIONS",
    title: "Organized by\nfeeling.",
    description: "Make loose references feel like a point of view.",
  },
  "/search": {
    eyebrow: "SEARCH YOUR ARCHIVE",
    title: "Find the\nright signal.",
    description:
      "Search titles, tags, and descriptions across your collection.",
  },
  "/settings": {
    eyebrow: "SETTINGS",
    title: "Make it feel\nlike yours.",
    description: "Tune your profile, storage, and notification preferences.",
  },
};

const COLLECTIONS: Array<{
  title: string;
  count: string;
  image: string;
  tone: string;
}> = [];

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  return `${(bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function Logo() {
  return (
    <Link href="/" className="brand-lockup" aria-label="WILKAXYZ home">
      <span className="brand-orbit">
        <span />
      </span>
      <span className="brand-wordmark">WILKAXYZ</span>
    </Link>
  );
}

function MediaCard({
  item,
  onFavorite,
  onDelete,
  canDelete = true,
}: {
  item: MediaItem;
  onFavorite: (id: number) => void;
  onDelete: (id: number) => void;
  canDelete?: boolean;
}) {
  return (
    <article className={`media-card media-card--${item.ratio}`}>
      <div className="media-card__visual">
        {item.image ? (
          <img src={item.image} alt={item.title} loading="lazy" />
        ) : (
          <div className="media-card__file-placeholder">
            <FileText size={32} />
            <span>{item.kind.toUpperCase()}</span>
          </div>
        )}
        <div className="media-card__shade" />
        {item.kind === "video" && (
          <span className="play-badge">
            <Play size={13} fill="currentColor" />
          </span>
        )}
        <button
          className={`favorite-button ${item.favorite ? "is-favorite" : ""}`}
          onClick={() => onFavorite(item.id)}
          aria-label={
            item.favorite ? "Remove from favorites" : "Add to favorites"
          }
        >
          <Heart size={16} fill={item.favorite ? "currentColor" : "none"} />
        </button>
        <span className="media-card__kind">{item.category}</span>
      </div>
      <div className="media-card__body">
        <div className="media-card__copy">
          <h3>{item.title}</h3>
          <p>{item.subtitle}</p>
        </div>
        {canDelete && (<button
          className="icon-button icon-button--small"
          onClick={() => onDelete(item.id)}
          aria-label={`Delete ${item.title}`}
        >
          <MoreHorizontal size={16} />
        </button>)}
      </div>
      <div className="media-card__meta">
        <span>{item.date}</span>
        <span>{item.size}</span>
      </div>
    </article>
  );
}

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function UploadPanel({
  onClose,
  onUpload,
}: {
  onClose: () => void;
  onUpload: (item: MediaItem) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Photos");
  const [tags, setTags] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) return;
    const nextTitle = title.trim() || fileName || "Untitled upload";
    onUpload({
      id: Date.now(),
      title: nextTitle,
      subtitle: fileName
        ? `Uploaded file · ${fileName}`
        : "New collection item",
      category,
      kind:
        category === "Videos"
          ? "video"
          : category === "Projects"
            ? "project"
            : category === "Websites"
              ? "website"
              : "photo",
      tags: tags
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean),
      image: file.type.startsWith("image/")
        ? await fileToDataUrl(file)
        : undefined,
      date: "Just now",
      size: formatBytes(file.size),
      sizeBytes: file.size,
      favorite: false,
      ratio: "landscape",
    });
    setSaved(true);
    window.setTimeout(onClose, 650);
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-title"
    >
      <div className="upload-panel">
        <div className="panel-topline">
          <span className="eyebrow">UPLOAD CENTER</span>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close upload panel"
          >
            <X size={18} />
          </button>
        </div>
        <h2 id="upload-title">
          Add something
          <br />
          <span>to the archive.</span>
        </h2>
        <p className="panel-intro">
          Drop in a photo, a project, or a little piece of the internet. We’ll
          keep the context with it.
        </p>
        <form onSubmit={submit}>
          <label className="dropzone">
            <input
              type="file"
              accept="image/*,video/*,.zip,.html,.css,.js,.py,.pdf,.doc,.docx"
              onChange={event => {
                const selected = event.target.files?.[0] || null;
                setFile(selected);
                setFileName(selected?.name || "");
              }}
            />
            <span className="dropzone__icon">
              <Upload size={19} />
            </span>
            <strong>{fileName || "Choose a file to begin"}</strong>
            <small>Images, video, ZIP, HTML, CSS, JS, Python, docs</small>
          </label>
          <div className="form-grid">
            <label>
              <span>Title</span>
              <input
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="Give it a name"
              />
            </label>
            <label>
              <span>Category</span>
              <select
                value={category}
                onChange={event => setCategory(event.target.value)}
              >
                <option>Photos</option>
                <option>Videos</option>
                <option>Projects</option>
                <option>Websites</option>
                <option>Documents</option>
              </select>
            </label>
          </div>
          <label>
            <span>Tags</span>
            <input
              value={tags}
              onChange={event => setTags(event.target.value)}
              placeholder="night, visual, reference"
            />
          </label>
          <button
            className="primary-button primary-button--full"
            type="submit"
            disabled={!file || saved}
          >
            {saved ? (
              <>
                <Check size={17} /> Added to collection
              </>
            ) : (
              <>
                <Plus size={17} /> Add to WILKAXYZ
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  const [location, navigate] = useLocation();
  const { items, connected, addItem, toggleFavorite, deleteItem } =
    useRealtimeItems();
  const { user, isAdmin, loading: authLoading, signInWithGoogle, signOut } =
    useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const canUpload = !authEnabled || !!user;
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All items");
  const [uploadOpen, setUploadOpen] = useState(location === "/upload");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const page = PAGE_META[location] || PAGE_META["/"];
  const photoCount = items.filter(item => item.category === "Photos").length;
  const videoCount = items.filter(item => item.category === "Videos").length;
  const projectCount = items.filter(
    item => item.category === "Projects"
  ).length;
  const websiteCount = items.filter(
    item => item.category === "Websites"
  ).length;
  const favoriteCount = items.filter(item => item.favorite).length;
  const storageBytes = items.reduce(
    (total, item) => total + (item.sizeBytes || 0),
    0
  );
  const storagePercent = Math.min(
    100,
    Math.round((storageBytes / (10 * 1024 * 1024 * 1024)) * 100)
  );

  useEffect(() => {
    setUploadOpen(location === "/upload");
    if (location === "/search") setActiveFilter("All items");
  }, [location]);

  const pageItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const routeFilter: Record<string, string | undefined> = {
      "/photos": "Photos",
      "/videos": "Videos",
      "/projects": "Projects",
      "/websites": "Websites",
      "/favorites": "Favorites",
    };
    return items.filter(item => {
      const matchesRoute =
        location === "/favorites"
          ? item.favorite
          : !routeFilter[location] || item.category === routeFilter[location];
      const matchesFilter =
        activeFilter === "All items" || item.category === activeFilter;
      const matchesSearch =
        !normalizedSearch ||
        [item.title, item.subtitle, item.category, ...item.tags]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      return matchesRoute && matchesFilter && matchesSearch;
    });
  }, [activeFilter, items, location, search]);

  const handleFavorite = (id: number) => {
    void toggleFavorite(id);
  };
  const handleDelete = (id: number) => {
    void deleteItem(id);
  };
  const handleUpload = (item: MediaItem) => {
    addItem(item).catch(err =>
      window.alert(`Upload gagal: ${err?.message || "coba lagi"}`)
    );
  };
  const openUpload = () => {
    setMobileNavOpen(false);
    if (!canUpload) {
      setLoginOpen(true);
      return;
    }
    setUploadOpen(true);
    navigate("/upload");
  };
  const closeUpload = () => {
    setUploadOpen(false);
    navigate("/");
  };
  const closeLogin = () => {
    setLoginOpen(false);
    setUploadOpen(false);
    if (location === "/upload") navigate("/");
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "is-open" : ""}`}>
        <div className="sidebar__head">
          <Logo />
          <button
            className="icon-button sidebar-close"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <div
          className="profile-mini"
          onClick={() => (user || !authEnabled ? undefined : setLoginOpen(true))}
        >
          <div className="avatar avatar--lime">
            {user?.avatar ? (
              <img src={user.avatar} alt="" referrerPolicy="no-referrer" />
            ) : (
              (user?.name?.charAt(0) || (authEnabled ? "G" : "W")).toUpperCase()
            )}
          </div>
          <div>
            <strong>{user?.name || (authEnabled ? "Guest" : "Wilka")}</strong>
            <span>
              {user
                ? isAdmin
                  ? "Admin"
                  : user.email
                : authEnabled
                  ? "Tap to sign in"
                  : "Personal space"}
            </span>
          </div>
          {user ? (
            <button
              className="icon-button"
              onClick={e => {
                e.stopPropagation();
                void signOut();
              }}
              aria-label="Sign out"
            >
              <LogOut size={15} />
            </button>
          ) : (
            <ChevronDown size={15} />
          )}
        </div>
        <div className="nav-section-label">SPACE</div>
        <nav className="main-nav">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileNavOpen(false)}
              className={`nav-link ${location === href ? "is-active" : ""}`}
            >
              <Icon size={17} strokeWidth={location === href ? 2.2 : 1.8} />
              <span>{label}</span>
              {href === "/favorites" && favoriteCount > 0 && (
                <span className="nav-count">{favoriteCount}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar__bottom">
          <Link href="/admin" className="nav-link nav-link--admin">
            <LayoutDashboard size={17} />
            <span>Admin dashboard</span>
            <ArrowUpRight size={14} />
          </Link>
          <Link
            href="/settings"
            className={`nav-link ${location === "/settings" ? "is-active" : ""}`}
          >
            <Settings size={17} />
            <span>Settings</span>
          </Link>
          <div className="storage-mini">
            <div className="storage-mini__top">
              <span>Storage used</span>
              <strong>{storagePercent}%</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${storagePercent}%` }} />
            </div>
            <small>{formatBytes(storageBytes)} of 10 GB</small>
          </div>
        </div>
      </aside>

      <div className="mobile-topbar">
        <button
          className="icon-button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <Logo />
        <button className="icon-button" aria-label="Notifications">
          <Bell size={19} />
        </button>
      </div>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar__crumb">
            <span>WILKAXYZ</span>
            <span className="crumb-dot">/</span>
            <strong>{page.eyebrow.toLowerCase()}</strong>
          </div>
          <div className="topbar__actions">
            <button className="round-status">
              <span className="status-dot" />{" "}
              {connected ? "Live sync active" : "Connecting…"}
            </button>
            <div className="avatar avatar--dark">W</div>
          </div>
        </header>

        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow">{page.eyebrow}</div>
            <h1>
              {page.title.split("\n").map((line, index) => (
                <span key={line}>
                  {line}
                  {index < page.title.split("\n").length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p>{page.description}</p>
          </div>
          <div className="hero-actions">
            <button
              className="secondary-button"
              onClick={() => navigate("/collections")}
            >
              <Sparkles size={16} /> Curate space
            </button>
            <button className="primary-button" onClick={openUpload}>
              <Upload size={16} /> Upload new
            </button>
          </div>
        </section>

        {location === "/collections" ? (
          <section className="collections-grid">
            {COLLECTIONS.length ? (
              COLLECTIONS.map(collection => <article key={collection.title} />)
            ) : (
              <div className="empty-state empty-state--wide">
                <Archive size={24} />
                <h3>Your collections are empty</h3>
                <p>Create a collection after you add your first file.</p>
                <button className="primary-button" onClick={openUpload}>
                  <Upload size={16} /> Upload first file
                </button>
              </div>
            )}
            <button
              className="collection-card collection-card--new"
              onClick={openUpload}
            >
              <Plus size={24} />
              <strong>New collection</strong>
              <span>Start with a feeling</span>
            </button>
          </section>
        ) : location === "/settings" ? (
          <SettingsPanel />
        ) : (
          <>
            <section className="quick-stats">
              <div>
                <span>COLLECTIONS</span>
                <strong>{items.length ? 1 : 0}</strong>
                <small>
                  {items.length
                    ? "Personal archive"
                    : "Create after first upload"}
                </small>
              </div>
              <div>
                <span>STORED ITEMS</span>
                <strong>{items.length}</strong>
                <small>
                  {items.length ? "Your uploaded files" : "No files yet"}
                </small>
              </div>
              <div>
                <span>PHOTOS / VIDEOS</span>
                <strong>{photoCount + videoCount}</strong>
                <small>
                  {videoCount} videos · {photoCount} photos
                </small>
              </div>
              <div>
                <span>STORAGE</span>
                <strong>{formatBytes(storageBytes)}</strong>
                <small>of 10 GB available</small>
              </div>
            </section>
            <section className="library-toolbar">
              <div className="filter-tabs">
                {FILTERS.map(filter => (
                  <button
                    key={filter}
                    className={activeFilter === filter ? "is-active" : ""}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="search-control">
                <Search size={17} />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search your archive"
                />
                <kbd>⌘ K</kbd>
              </div>
            </section>
            {location === "/" && (
              <section className="feature-strip feature-strip--empty">
                <div className="feature-strip__copy">
                  <span className="eyebrow">YOUR PRIVATE ARCHIVE</span>
                  <h2>
                    Ready for the
                    <br />
                    <span>first signal.</span>
                  </h2>
                  <p>
                    No files are stored yet. Upload something personal and your
                    collection will start here.
                  </p>
                  <button className="primary-button" onClick={openUpload}>
                    <Upload size={15} /> Upload first file
                  </button>
                </div>
                <div className="feature-strip__visual">
                  <div className="orbit-line orbit-line--one" />
                  <div className="orbit-line orbit-line--two" />
                  <div className="feature-orb feature-orb--empty">
                    <Plus size={22} />
                  </div>
                  <div className="feature-strip__caption">
                    <strong>EMPTY BY DESIGN</strong>
                    <span>Waiting for your content</span>
                  </div>
                </div>
              </section>
            )}
            <section className="section-heading">
              <div>
                <span className="eyebrow">
                  {location === "/" ? "RECENTLY UPLOADED" : "YOUR COLLECTION"}
                </span>
                <h2>
                  {pageItems.length} {pageItems.length === 1 ? "item" : "items"}{" "}
                  in view
                </h2>
              </div>
              <button className="sort-button">
                Recently added <ChevronDown size={15} />
              </button>
            </section>
            {pageItems.length ? (
              <div className="media-masonry">
                {pageItems.map(item => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    onFavorite={handleFavorite}
                    onDelete={handleDelete}
                    canDelete={!authEnabled || isAdmin || item.ownerId === user?.id}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Search size={24} />
                <h3>No signal found</h3>
                <p>Try another search or add something new to the archive.</p>
                <button className="primary-button" onClick={openUpload}>
                  <Upload size={16} /> Upload new
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <nav className="mobile-dock" aria-label="Main">
        {[
          { href: "/", label: "Home", Icon: Compass },
          { href: "/gallery", label: "Gallery", Icon: Grid2X2 },
        ].map(({ href, label, Icon }) => (
          <Link key={href} href={href} aria-label={label} className={location === href ? "is-active" : ""}>
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
        <button className="dock-add" onClick={openUpload} aria-label="Upload new">
          <Plus size={22} />
        </button>
        {[
          { href: "/favorites", label: "Saved", Icon: Heart },
          { href: "/settings", label: "More", Icon: Settings },
        ].map(({ href, label, Icon }) => (
          <Link key={href} href={href} aria-label={label} className={location === href ? "is-active" : ""}>
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      {uploadOpen && canUpload && (
        <UploadPanel onClose={closeUpload} onUpload={handleUpload} />
      )}
      {(loginOpen || (uploadOpen && !canUpload && !authLoading)) && (
        <LoginModal
          onClose={closeLogin}
          onGoogle={() => void signInWithGoogle("/upload")}
        />
      )}
    </div>
  );
}

function LoginModal({
  onClose,
  onGoogle,
}: {
  onClose: () => void;
  onGoogle: () => void;
}) {
  return (
    <div className="login-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="login-card" onClick={e => e.stopPropagation()}>
        <h2>Masuk untuk upload</h2>
        <p>
          Melihat koleksi tidak perlu login. Untuk upload, kamu perlu masuk
          dengan akun Google.
        </p>
        <button className="google-button" onClick={onGoogle}>
          <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Lanjutkan dengan Google
        </button>
        <button className="login-skip" onClick={onClose}>
          Nanti saja
        </button>
      </div>
    </div>
  );
}

function SettingsPanel() {
  return (
    <section className="settings-panel">
      <div className="settings-panel__intro">
        <div className="avatar avatar--lime avatar--large">W</div>
        <div>
          <span className="eyebrow">PROFILE</span>
          <h2>Wilka’s space</h2>
          <p>Private collection · Owner account</p>
        </div>
        <button className="secondary-button">Edit profile</button>
      </div>
      <div className="settings-list">
        <div>
          <div>
            <strong>Quiet mode</strong>
            <span>Keep notifications subtle while you work.</span>
          </div>
          <span className="toggle is-on">
            <i />
          </span>
        </div>
        <div>
          <div>
            <strong>Auto-organize uploads</strong>
            <span>Use file type and tags to suggest a collection.</span>
          </div>
          <span className="toggle is-on">
            <i />
          </span>
        </div>
        <div>
          <div>
            <strong>Weekly archive note</strong>
            <span>A gentle reminder to revisit your saved work.</span>
          </div>
          <span className="toggle">
            <i />
          </span>
        </div>
      </div>
      <div className="settings-note">
        <CircleHelp size={17} />
        <span>
          Need help? Your archive is private by default and can be exported
          whenever you need a backup.
        </span>
      </div>
    </section>
  );
}
