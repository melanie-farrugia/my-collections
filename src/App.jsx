import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://elztnvysflbxbqvbzrhn.supabase.co";
const SUPABASE_KEY = "sb_publishable_uT57zDehfnmVbtiRzl0r0Q_D8ylbttj";

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const CATEGORIES = ["All", "Recipes", "Patterns", "Other"];
const EMOJI_MAP = { Recipes: "🍴", Patterns: "🧶", Other: "📌" };
const TYPE_COLORS = {
  Recipes: { bg: "#e0f4f1", text: "#1a6b5e", dot: "#2ab8a0" },
  Patterns: { bg: "#ddf0f8", text: "#1a5a7a", dot: "#2a9fd6" },
  Other: { bg: "#e3edf7", text: "#2a4a6b", dot: "#5a8fc2" },
};

function ItemCard({ item, collections, onEdit, onDelete, onToggleCollection }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  const colors = TYPE_COLORS[item.type] || TYPE_COLORS.Other;

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="card">
      <div className="card-accent" style={{ background: `linear-gradient(90deg, ${colors.dot}, ${colors.dot}88)` }} />
      <div className="card-inner">
        <div className="card-header">
          <span className="card-type" style={{ background: colors.bg, color: colors.text }}>
            <span className="type-dot" style={{ background: colors.dot }} />
            {item.type}
          </span>
          <div className="card-actions" ref={menuRef}>
            <button className="icon-btn" onClick={() => setMenuOpen(!menuOpen)}>⋯</button>
            {menuOpen && (
              <div className="dropdown">
                <button onClick={() => { onEdit(item); setMenuOpen(false); }}>✏️ Edit</button>
                <div className="dropdown-divider" />
                <div className="dropdown-label">Collections</div>
                {collections.map(col => (
                  <button key={col.name} onClick={() => { onToggleCollection(item.id, col.name); setMenuOpen(false); }}
                    className={item.collections?.includes(col.name) ? "col-active" : ""}>
                    {item.collections?.includes(col.name) ? "✓ " : "+ "}{col.name}
                  </button>
                ))}
                <div className="dropdown-divider" />
                <button className="danger" onClick={() => { onDelete(item.id); setMenuOpen(false); }}>🗑 Delete</button>
              </div>
            )}
          </div>
        </div>
        <h3 className="card-title">{item.title}</h3>
        {item.source && (
          <a className="card-source" href={item.source.startsWith("http") ? item.source : "#"} target="_blank" rel="noreferrer">
            🔗 {item.source.length > 48 ? item.source.slice(0, 45) + "…" : item.source}
          </a>
        )}
        {item.notes && <p className="card-notes">{item.notes.length > 160 ? item.notes.slice(0, 157) + "…" : item.notes}</p>}
        <div className="card-footer">
          {item.collections?.length > 0 && (
            <div className="card-tags">
              {item.collections.map(c => <span key={c} className="tag">{c}</span>)}
            </div>
          )}
          <span className="card-date">{new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
        </div>
      </div>
    </div>
  );
}

function AddCollectionRow({ onAdd, kind }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), kind);
    setName(""); setAdding(false);
  };
  return adding ? (
    <div className="add-col-form">
      <input autoFocus value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
        placeholder={kind === "cuisine" ? "e.g. Italian, Asian…" : "Collection name…"} />
      <button className="add-col-btn" onClick={handleAdd}>+</button>
    </div>
  ) : (
    <button className="add-col-link" onClick={() => setAdding(true)}>
      + New {kind === "cuisine" ? "Cuisine" : "Collection"}
    </button>
  );
}

function Modal({ item, collections, onSave, onClose }) {
  const [title, setTitle] = useState(item?.title || "");
  const [type, setType] = useState(item?.type || "Recipes");
  const [source, setSource] = useState(item?.source || "");
  const [notes, setNotes] = useState(item?.notes || "");
  const [cols, setCols] = useState(item?.collections || []);
  const [saving, setSaving] = useState(false);
  const toggleCol = (c) => setCols(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({ id: item?.id || Date.now(), title: title.trim(), type, source: source.trim(), notes: notes.trim(), collections: cols, created_at: item?.created_at || Date.now() });
    setSaving(false);
  };

  const regularCols = collections.filter(c => c.kind === "collection");
  const cuisineCols = collections.filter(c => c.kind === "cuisine");

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target.className === "modal-overlay") onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2>{item?.id ? "Edit Item" : "Add New Item"}</h2>
            <p className="modal-sub">Save a recipe or pattern to your collections</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Name this recipe or pattern…" autoFocus />
          </div>
          <div className="field">
            <label>Type</label>
            <div className="type-select">
              {["Recipes","Patterns","Other"].map(t => {
                const c = TYPE_COLORS[t];
                return (
                  <button key={t} onClick={() => setType(t)}
                    className={"type-btn" + (type === t ? " active" : "")}
                    style={type === t ? { background: c.dot, borderColor: c.dot, color: "white" } : {}}>
                    {EMOJI_MAP[t]} {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="field">
            <label>Source</label>
            <input value={source} onChange={e => setSource(e.target.value)} placeholder="URL or where you found it…" />
          </div>
          <div className="field">
            <label>Notes / Content</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Paste the full recipe, instructions, or anything useful…" rows={6} />
          </div>
          {regularCols.length > 0 && (
            <div className="field">
              <label>Collections</label>
              <div className="col-checkboxes">
                {regularCols.map(c => (
                  <label key={c.name} className={"col-check" + (cols.includes(c.name) ? " checked" : "")}>
                    <input type="checkbox" checked={cols.includes(c.name)} onChange={() => toggleCol(c.name)} hidden />📁 {c.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          {cuisineCols.length > 0 && (
            <div className="field">
              <label>Cuisine</label>
              <div className="col-checkboxes">
                {cuisineCols.map(c => (
                  <label key={c.name} className={"col-check cuisine" + (cols.includes(c.name) ? " checked" : "")}>
                    <input type="checkbox" checked={cols.includes(c.name)} onChange={() => toggleCol(c.name)} hidden />🍽️ {c.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={!title.trim() || saving}>
            {saving ? "Saving…" : "Save Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [activeCollection, setActiveCollection] = useState(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 600);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [itemsData, colsData] = await Promise.all([
          sbFetch("items?order=created_at.desc"),
          sbFetch("collections?order=name.asc"),
        ]);
        setItems(itemsData || []);
        setCollections(colsData || []);
      } catch (e) {
        setError("Could not connect to database. Check your Supabase URL and key.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = items.filter(item => {
    const matchType = activeTab === "All" || item.type === activeTab;
    const matchCol = !activeCollection || item.collections?.includes(activeCollection);
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.notes?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchCol && matchSearch;
  });

  const handleSave = async (item) => {
    try {
      if (items.find(i => i.id === item.id)) {
        await sbFetch(`items?id=eq.${item.id}`, { method: "PATCH", prefer: "return=representation", body: JSON.stringify(item) });
        setItems(prev => prev.map(i => i.id === item.id ? item : i));
      } else {
        await sbFetch("items", { method: "POST", prefer: "return=representation", body: JSON.stringify(item) });
        setItems(prev => [item, ...prev]);
      }
    } catch (e) { alert("Failed to save. Please try again."); }
    setModalOpen(false); setEditItem(null);
  };

  const handleDelete = async (id) => {
    try {
      await sbFetch(`items?id=eq.${id}`, { method: "DELETE" });
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) { alert("Failed to delete."); }
  };

  const handleToggleCollection = async (id, col) => {
    const item = items.find(i => i.id === id);
    const updated = { ...item, collections: item.collections?.includes(col) ? item.collections.filter(c => c !== col) : [...(item.collections || []), col] };
    try {
      await sbFetch(`items?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ collections: updated.collections }) });
      setItems(prev => prev.map(i => i.id === id ? updated : i));
    } catch (e) { alert("Failed to update."); }
  };

  const handleAddCollection = async (name, kind) => {
    if (!name || collections.find(c => c.name === name)) return;
    try {
      await sbFetch("collections", { method: "POST", prefer: "return=representation", body: JSON.stringify({ name, kind }) });
      setCollections(prev => [...prev, { name, kind }]);
    } catch (e) { alert("Failed to add."); }
  };

  const handleDeleteCollection = async (col) => {
    try {
      await sbFetch(`collections?name=eq.${encodeURIComponent(col)}`, { method: "DELETE" });
      setCollections(prev => prev.filter(c => c.name !== col));
      setItems(prev => prev.map(i => ({ ...i, collections: i.collections?.filter(c => c !== col) })));
      if (activeCollection === col) setActiveCollection(null);
    } catch (e) { alert("Failed to delete collection."); }
  };

  const regularCols = collections.filter(c => c.kind === "collection");
  const cuisineCols = collections.filter(c => c.kind === "cuisine");

  const heading = activeCollection
    ? (cuisineCols.find(c => c.name === activeCollection) ? `🍽️ ${activeCollection}` : `📁 ${activeCollection}`)
    : activeTab === "All" ? "All Items" : `${EMOJI_MAP[activeTab] || ""} ${activeTab}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Outfit:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #f0f7f9; --surface: #ffffff; --sidebar-bg: #0d3349; --sidebar-hover: #153f5a;
          --teal: #1a7a6e; --teal-mid: #2ab8a0; --teal-light: #e0f4f1;
          --blue: #1a5a8a; --blue-mid: #2a9fd6; --blue-light: #ddf0f8;
          --mist: #e8f4f8; --border: #cce4ee; --text: #0d3349; --text-mid: #3a6070;
          --text-soft: #7aaabb; --shadow: rgba(13,51,73,0.10); --shadow-lg: rgba(13,51,73,0.18); --radius: 14px;
        }
        body { font-family: 'Outfit', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
        .app { display: flex; height: 100vh; overflow: hidden; }

        .sidebar { width: 248px; min-width: 248px; background: var(--sidebar-bg); display: flex; flex-direction: column; transition: width 0.3s ease, min-width 0.3s ease; overflow: hidden; position: relative; flex-shrink: 0; }
        .sidebar::after { content: ''; position: absolute; top: -80px; right: -80px; width: 220px; height: 220px; border-radius: 50%; background: radial-gradient(circle, rgba(42,184,160,0.12), transparent 70%); pointer-events: none; }
        .sidebar.closed { width: 0; min-width: 0; }
        .sidebar-logo { padding: 28px 20px 18px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .logo-mark { font-size: 1.7rem; margin-bottom: 8px; display: block; }
        .sidebar-logo h1 { font-family: 'Playfair Display', serif; font-size: 1.15rem; color: white; white-space: nowrap; }
        .sidebar-logo p { font-size: 0.68rem; color: rgba(255,255,255,0.35); margin-top: 3px; white-space: nowrap; letter-spacing: 0.06em; text-transform: uppercase; }
        .sidebar-scroll { flex: 1; overflow-y: auto; }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .sidebar-section { padding: 18px 12px 4px; }
        .sidebar-section-title { font-size: 0.58rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,255,255,0.28); padding: 0 10px; margin-bottom: 4px; white-space: nowrap; }
        .sidebar-item { display: flex; align-items: center; justify-content: space-between; padding: 9px 10px; border-radius: 9px; cursor: pointer; font-size: 0.84rem; color: rgba(255,255,255,0.6); transition: background 0.15s, color 0.15s; white-space: nowrap; }
        .sidebar-item:hover { background: var(--sidebar-hover); color: rgba(255,255,255,0.9); }
        .sidebar-item.active { background: linear-gradient(135deg, var(--teal), #169080); color: white; font-weight: 500; box-shadow: 0 4px 14px rgba(26,122,110,0.4); }
        .sidebar-item-left { display: flex; align-items: center; gap: 9px; overflow: hidden; }
        .sidebar-item-left span:last-child { overflow: hidden; text-overflow: ellipsis; }
        .sidebar-count { font-size: 0.66rem; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.45); padding: 1px 8px; border-radius: 10px; flex-shrink: 0; }
        .sidebar-item.active .sidebar-count { background: rgba(255,255,255,0.22); color: white; }
        .col-del { background: none; border: none; cursor: pointer; font-size: 0.62rem; color: rgba(255,255,255,0.2); padding: 2px 5px; border-radius: 4px; opacity: 0; transition: opacity 0.15s, color 0.15s; flex-shrink: 0; }
        .sidebar-item:hover .col-del { opacity: 1; }
        .col-del:hover { color: #ff8888 !important; }
        .sidebar-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 6px 16px; }
        .add-col-form { padding: 4px 12px 8px; display: flex; gap: 6px; }
        .add-col-form input { flex: 1; padding: 7px 10px; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; font-size: 0.8rem; background: rgba(255,255,255,0.08); color: white; outline: none; font-family: 'Outfit', sans-serif; }
        .add-col-form input::placeholder { color: rgba(255,255,255,0.3); }
        .add-col-form input:focus { border-color: var(--teal-mid); }
        .add-col-btn { padding: 7px 12px; background: var(--teal); color: white; border: none; border-radius: 8px; font-size: 0.9rem; cursor: pointer; }
        .add-col-btn:hover { background: var(--teal-mid); }
        .add-col-link { display: block; padding: 6px 22px 12px; font-size: 0.78rem; color: rgba(255,255,255,0.3); cursor: pointer; background: none; border: none; text-align: left; font-family: 'Outfit', sans-serif; transition: color 0.15s; }
        .add-col-link:hover { color: var(--teal-mid); }
        .sidebar-section.cuisine .sidebar-section-title { color: rgba(255,210,120,0.5); }
        .sidebar-section.cuisine .sidebar-item.active { background: linear-gradient(135deg, #b06a1a, #d4882a); box-shadow: 0 4px 14px rgba(176,106,26,0.4); }
        .sidebar-section.cuisine .add-col-link:hover { color: #f0b860; }

        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .topbar { display: flex; align-items: center; gap: 14px; padding: 16px 28px; background: var(--surface); border-bottom: 1px solid var(--border); box-shadow: 0 1px 4px rgba(13,51,73,0.06); }
        .toggle-sidebar { background: none; border: none; cursor: pointer; padding: 7px 9px; border-radius: 8px; color: var(--text-soft); font-size: 1rem; transition: background 0.15s, color 0.15s; }
        .toggle-sidebar:hover { background: var(--mist); color: var(--text); }
        .search-wrap { flex: 1; position: relative; max-width: 460px; }
        .search-wrap input { width: 100%; padding: 9px 16px 9px 40px; border: 1.5px solid var(--border); border-radius: 28px; background: var(--bg); font-size: 0.875rem; font-family: 'Outfit', sans-serif; color: var(--text); outline: none; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; }
        .search-wrap input:focus { border-color: var(--teal-mid); box-shadow: 0 0 0 3px rgba(42,184,160,0.14); background: white; }
        .search-wrap input::placeholder { color: var(--text-soft); }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-soft); font-size: 0.85rem; pointer-events: none; }
        .btn-add { display: flex; align-items: center; gap: 7px; padding: 9px 22px; background: linear-gradient(135deg, var(--teal), #169080); color: white; border: none; border-radius: 28px; font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; white-space: nowrap; box-shadow: 0 4px 16px rgba(26,122,110,0.32); transition: transform 0.15s, box-shadow 0.15s; }
        .btn-add:hover { transform: translateY(-1px); box-shadow: 0 7px 22px rgba(26,122,110,0.42); }
        .btn-add:active { transform: scale(0.97); }
        .hero-bar { display: flex; align-items: center; padding: 22px 28px 0; }
        .hero-bar h2 { font-family: 'Playfair Display', serif; font-size: 1.6rem; color: var(--text); font-weight: 500; }
        .tabs { display: flex; gap: 6px; padding: 16px 28px 0; }
        .tab { padding: 8px 18px; border-radius: 28px; font-size: 0.82rem; font-weight: 500; cursor: pointer; border: 1.5px solid var(--border); color: var(--text-mid); background: white; transition: all 0.15s; font-family: 'Outfit', sans-serif; }
        .tab:hover { border-color: var(--teal-mid); color: var(--text); }
        .tab.active { background: var(--text); color: white; border-color: var(--text); box-shadow: 0 3px 10px rgba(13,51,73,0.22); }
        .content { flex: 1; overflow-y: auto; padding: 20px 28px 40px; }
        .results-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .results-info { font-size: 0.75rem; color: var(--text-soft); white-space: nowrap; }
        .results-divider { flex: 1; height: 1px; background: var(--border); }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 18px; }

        .card { background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 2px 8px var(--shadow); animation: fadeUp 0.35s ease both; transition: box-shadow 0.22s, transform 0.22s; }
        .card:hover { box-shadow: 0 10px 32px var(--shadow-lg); transform: translateY(-3px); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .card-accent { height: 3px; flex-shrink: 0; }
        .card-inner { padding: 16px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
        .card-header { display: flex; align-items: center; justify-content: space-between; }
        .card-type { display: flex; align-items: center; gap: 5px; font-size: 0.66rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 10px; border-radius: 20px; }
        .type-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .card-title { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 500; color: var(--text); line-height: 1.35; }
        .card-source { font-size: 0.72rem; color: var(--blue-mid); text-decoration: none; word-break: break-all; }
        .card-source:hover { text-decoration: underline; }
        .card-notes { font-size: 0.79rem; color: var(--text-mid); line-height: 1.55; white-space: pre-line; }
        .card-footer { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 6px; }
        .card-tags { display: flex; flex-wrap: wrap; gap: 5px; }
        .tag { background: var(--mist); color: var(--blue); font-size: 0.66rem; padding: 2px 9px; border-radius: 12px; border: 1px solid var(--border); font-weight: 500; }
        .card-date { font-size: 0.66rem; color: var(--text-soft); white-space: nowrap; }
        .icon-btn { background: none; border: none; cursor: pointer; font-size: 1.2rem; color: var(--text-soft); padding: 3px 7px; border-radius: 7px; line-height: 1; transition: background 0.15s, color 0.15s; }
        .icon-btn:hover { background: var(--mist); color: var(--text); }
        .card-actions { position: relative; }
        .dropdown { position: absolute; right: 0; top: calc(100% + 4px); background: white; border: 1px solid var(--border); border-radius: 11px; box-shadow: 0 12px 36px var(--shadow-lg); z-index: 100; min-width: 165px; overflow: hidden; animation: fadeDown 0.15s ease; }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .dropdown button { display: block; width: 100%; text-align: left; padding: 9px 15px; background: none; border: none; font-size: 0.82rem; color: var(--text); cursor: pointer; font-family: 'Outfit', sans-serif; transition: background 0.12s; }
        .dropdown button:hover { background: var(--mist); }
        .dropdown button.col-active { font-weight: 600; color: var(--teal); }
        .dropdown button.danger { color: #c0392b; }
        .dropdown-divider { height: 1px; background: var(--border); }
        .dropdown-label { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-soft); padding: 8px 15px 4px; }

        .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px 20px; gap: 16px; }
        .spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--teal-mid); border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-state p { font-size: 0.85rem; color: var(--text-soft); }
        .error-banner { background: #fff0f0; border: 1px solid #ffcccc; color: #c0392b; padding: 14px 20px; border-radius: 10px; margin-bottom: 20px; font-size: 0.85rem; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px 20px; gap: 16px; }
        .empty-orb { width: 84px; height: 84px; border-radius: 50%; background: linear-gradient(135deg, var(--teal-light), var(--blue-light)); display: flex; align-items: center; justify-content: center; font-size: 2.2rem; box-shadow: 0 8px 28px rgba(42,184,160,0.2); }
        .empty-state p { font-family: 'Playfair Display', serif; font-style: italic; font-size: 1rem; color: var(--text-soft); text-align: center; }
        .empty-state small { font-size: 0.76rem; color: var(--text-soft); }

        .modal-overlay { position: fixed; inset: 0; background: rgba(13,51,73,0.5); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal { background: white; border-radius: 18px; width: 100%; max-width: 520px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 24px 64px rgba(13,51,73,0.28); animation: slideUp 0.25s ease; border: 1px solid var(--border); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        .modal-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 22px 26px 18px; border-bottom: 1px solid var(--border); }
        .modal-header h2 { font-family: 'Playfair Display', serif; font-size: 1.25rem; color: var(--text); }
        .modal-sub { font-size: 0.74rem; color: var(--text-soft); margin-top: 3px; }
        .close-btn { background: var(--mist); border: none; font-size: 0.78rem; cursor: pointer; color: var(--text-soft); padding: 6px 10px; border-radius: 8px; flex-shrink: 0; margin-top: 2px; }
        .close-btn:hover { background: var(--border); color: var(--text); }
        .modal-body { flex: 1; overflow-y: auto; padding: 20px 26px; display: flex; flex-direction: column; gap: 16px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-mid); }
        .field input, .field textarea { padding: 10px 13px; border: 1.5px solid var(--border); border-radius: 9px; font-size: 0.875rem; font-family: 'Outfit', sans-serif; color: var(--text); background: var(--bg); outline: none; resize: vertical; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; }
        .field input:focus, .field textarea:focus { border-color: var(--teal-mid); box-shadow: 0 0 0 3px rgba(42,184,160,0.12); background: white; }
        .field input::placeholder, .field textarea::placeholder { color: var(--text-soft); }
        .type-select { display: flex; gap: 8px; }
        .type-btn { flex: 1; padding: 9px 6px; border: 1.5px solid var(--border); border-radius: 9px; background: var(--bg); font-size: 0.8rem; cursor: pointer; color: var(--text-mid); transition: all 0.15s; font-family: 'Outfit', sans-serif; font-weight: 500; }
        .type-btn:hover { border-color: var(--teal-mid); color: var(--text); }
        .col-checkboxes { display: flex; flex-wrap: wrap; gap: 8px; }
        .col-check { padding: 6px 15px; border: 1.5px solid var(--border); border-radius: 20px; font-size: 0.8rem; cursor: pointer; color: var(--text-mid); transition: all 0.15s; font-weight: 500; }
        .col-check:hover { border-color: var(--teal-mid); color: var(--text); }
        .col-check.checked { background: linear-gradient(135deg, var(--teal), #169080); color: white; border-color: var(--teal); box-shadow: 0 2px 8px rgba(26,122,110,0.25); }
        .col-check.cuisine.checked { background: linear-gradient(135deg, #b06a1a, #d4882a); border-color: #b06a1a; box-shadow: 0 2px 8px rgba(176,106,26,0.25); }
        .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 26px; border-top: 1px solid var(--border); }
        .btn-ghost { padding: 9px 20px; border: 1.5px solid var(--border); border-radius: 9px; background: none; font-size: 0.875rem; cursor: pointer; color: var(--text-mid); font-family: 'Outfit', sans-serif; font-weight: 500; }
        .btn-ghost:hover { background: var(--mist); }
        .btn-primary { padding: 9px 24px; background: linear-gradient(135deg, var(--teal), #169080); color: white; border: none; border-radius: 9px; font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; box-shadow: 0 4px 14px rgba(26,122,110,0.3); transition: transform 0.15s, box-shadow 0.15s; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,122,110,0.4); }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
        @media (max-width: 600px) {
          .sidebar { position: absolute; z-index: 50; height: 100%; box-shadow: 4px 0 20px rgba(0,0,0,0.2); }
          .topbar, .hero-bar, .content { padding-left: 16px; padding-right: 16px; }
          .tabs { padding-left: 16px; padding-right: 16px; }
        }
      `}</style>

      <div className="app">
        <div className={"sidebar" + (sidebarOpen ? "" : " closed")}>
          <div className="sidebar-logo">
            <span className="logo-mark">🌿</span>
            <h1>My Collections</h1>
            <p>Recipes &amp; Patterns</p>
          </div>
          <div className="sidebar-scroll">
            <div className="sidebar-section">
              <div className="sidebar-section-title">Browse</div>
              {["All", "Recipes", "Patterns", "Other"].map(t => (
                <div key={t} className={"sidebar-item" + (!activeCollection && activeTab === t ? " active" : "")}
                  onClick={() => { setActiveTab(t); setActiveCollection(null); }}>
                  <span className="sidebar-item-left"><span>{EMOJI_MAP[t] || "🗂"}</span><span>{t}</span></span>
                  <span className="sidebar-count">{t === "All" ? items.length : items.filter(i => i.type === t).length}</span>
                </div>
              ))}
            </div>
            <div className="sidebar-divider" />
            <div className="sidebar-section">
              <div className="sidebar-section-title">Collections</div>
              {regularCols.map(col => (
                <div key={col.name} className={"sidebar-item" + (activeCollection === col.name ? " active" : "")}
                  onClick={() => { setActiveCollection(col.name); setActiveTab("All"); }}>
                  <span className="sidebar-item-left"><span>📁</span><span>{col.name}</span></span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="sidebar-count">{items.filter(i => i.collections?.includes(col.name)).length}</span>
                    <button className="col-del" onClick={e => { e.stopPropagation(); handleDeleteCollection(col.name); }}>✕</button>
                  </div>
                </div>
              ))}
              <AddCollectionRow onAdd={handleAddCollection} kind="collection" />
            </div>
            <div className="sidebar-divider" />
            <div className="sidebar-section cuisine">
              <div className="sidebar-section-title">Cuisines</div>
              {cuisineCols.map(col => (
                <div key={col.name} className={"sidebar-item" + (activeCollection === col.name ? " active" : "")}
                  onClick={() => { setActiveCollection(col.name); setActiveTab("All"); }}>
                  <span className="sidebar-item-left"><span>🍽️</span><span>{col.name}</span></span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="sidebar-count">{items.filter(i => i.collections?.includes(col.name)).length}</span>
                    <button className="col-del" onClick={e => { e.stopPropagation(); handleDeleteCollection(col.name); }}>✕</button>
                  </div>
                </div>
              ))}
              <AddCollectionRow onAdd={handleAddCollection} kind="cuisine" />
            </div>
          </div>
        </div>

        <div className="main">
          <div className="topbar">
            <button className="toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search titles and notes…" />
            </div>
            <button className="btn-add" onClick={() => { setEditItem(null); setModalOpen(true); }}>+ Add Item</button>
          </div>
          <div className="hero-bar"><h2>{heading}</h2></div>
          {!activeCollection && (
            <div className="tabs">
              {CATEGORIES.map(t => (
                <button key={t} className={"tab" + (activeTab === t ? " active" : "")} onClick={() => setActiveTab(t)}>
                  {EMOJI_MAP[t] ? `${EMOJI_MAP[t]} ` : ""}{t}
                </button>
              ))}
            </div>
          )}
          <div className="content">
            {error && <div className="error-banner">⚠️ {error}</div>}
            {loading ? (
              <div className="loading-state"><div className="spinner" /><p>Loading your collections…</p></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-orb">{activeCollection ? "🍽️" : "🌿"}</div>
                <p>{search ? "Nothing matches your search." : activeCollection ? `"${activeCollection}" is empty.` : "Nothing saved yet."}</p>
                <small>{search ? "" : "Click + Add Item to get started."}</small>
              </div>
            ) : (
              <>
                <div className="results-bar">
                  <span className="results-info">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
                  <div className="results-divider" />
                </div>
                <div className="grid">
                  {filtered.map((item, i) => (
                    <div key={item.id} style={{ animationDelay: `${i * 0.045}s` }}>
                      <ItemCard item={item} collections={collections}
                        onEdit={(it) => { setEditItem(it); setModalOpen(true); }}
                        onDelete={handleDelete}
                        onToggleCollection={handleToggleCollection} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <Modal item={editItem} collections={collections}
          onSave={handleSave} onClose={() => { setModalOpen(false); setEditItem(null); }} />
      )}
    </>
  );
}
  