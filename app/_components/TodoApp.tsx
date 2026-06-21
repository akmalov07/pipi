"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown, Moon, Sun, Plus, Pencil, Trash2 } from "lucide-react";

const STORAGE_KEY = "todo-app-notes";
const THEME_KEY = "todo-app-theme";

type FilterValue = "all" | "active" | "completed";

interface Note {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "active", label: "ACTIVE" },
  { value: "completed", label: "COMPLETED" },
];

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function TodoApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"new" | "edit">("new");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");

  const filterRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ---- load from localStorage on mount ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch (e) {
      console.error("Failed to read notes from storage", e);
    }
    setIsDark(document.documentElement.classList.contains("dark"));
    setHydrated(true);
  }, []);

  // ---- persist notes whenever they change ----
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error("Failed to save notes to storage", e);
    }
  }, [notes, hydrated]);

  // ---- close filter dropdown when clicking outside ----
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // ---- focus input when modal opens ----
  useEffect(() => {
    if (modalOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [modalOpen]);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch (e) {}
  }

  function openNewModal() {
    setModalMode("new");
    setDraftText("");
    setEditingId(null);
    setModalOpen(true);
  }

  function openEditModal(note: Note) {
    setModalMode("edit");
    setDraftText(note.text);
    setEditingId(note.id);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setDraftText("");
    setEditingId(null);
  }

  function applyModal() {
    const text = draftText.trim();
    if (!text) return;
    if (modalMode === "new") {
      setNotes((prev) => [
        ...prev,
        { id: uid(), text, completed: false, createdAt: Date.now() },
      ]);
    } else if (modalMode === "edit" && editingId) {
      setNotes((prev) =>
        prev.map((n) => (n.id === editingId ? { ...n, text } : n))
      );
    }
    closeModal();
  }

  function toggleComplete(id: string) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, completed: !n.completed } : n))
    );
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  const visibleNotes = useMemo(() => {
    return notes.filter((n) => {
      if (filter === "active" && n.completed) return false;
      if (filter === "completed" && !n.completed) return false;
      if (
        search.trim() &&
        !n.text.toLowerCase().includes(search.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [notes, filter, search]);

  const activeFilterLabel =
    FILTERS.find((f) => f.value === filter)?.label ?? "ALL";
  const isEmptyOverall = notes.length === 0;
  const isEmptyFiltered = notes.length > 0 && visibleNotes.length === 0;

  return (
    <div className="todo-page">
      <div className="todo-container">
        <h1 className="todo-title">TODO LIST</h1>

        {/* Controls row */}
        <div className="controls-row">
          <div className="search-wrap">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search note..."
              className="search-input"
            />
            <Search size={16} className="search-icon" />
          </div>

          {/* Filter dropdown */}
          <div className="filter-wrap" ref={filterRef}>
            <button className="filter-button" onClick={() => setFilterOpen((v) => !v)}>
              {activeFilterLabel}
              <ChevronDown
                size={14}
                className={`filter-chevron ${filterOpen ? "open" : ""}`}
              />
            </button>
            {filterOpen && (
              <div className="filter-menu animate-pop-in">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => {
                      setFilter(f.value);
                      setFilterOpen(false);
                    }}
                    className={`filter-option ${filter === f.value ? "active" : ""}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle color scheme"
            className="theme-toggle"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* List / Empty state */}
        {isEmptyOverall || isEmptyFiltered ? (
          <div className="empty-state animate-fade-in">
            {/* TODO: shu yerga o'zingiz xohlagan rasm/icon qo'ying.
                Faylni public/empty-state.png (yoki .svg) qilib joylashtiring,
                pastdagi src shu fayl nomiga mos kelishi kerak. */}
            <img src="/empty.png" alt="Empty" />
            <p>{isEmptyFiltered ? "No matching notes…" : "Empty…"}</p>
          </div>
        ) : (
          <ul className="note-list animate-fade-in">
            {visibleNotes.map((note) => (
              <li key={note.id} className="note-item">
                <button
                  onClick={() => toggleComplete(note.id)}
                  aria-label={note.completed ? "Mark as not done" : "Mark as done"}
                  className={`note-checkbox ${note.completed ? "checked" : ""}`}
                >
                  {note.completed && (
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                      <path
                        d="M3.5 8.5L6.2 11.2L12.5 4.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>

                <span className={`note-text ${note.completed ? "completed" : ""}`}>
                  {note.text}
                </span>

                <div className="note-actions">
                  <button
                    onClick={() => openEditModal(note)}
                    aria-label="Edit note"
                    className="note-action-btn"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    aria-label="Delete note"
                    className="note-action-btn delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Floating add button */}
      <button onClick={openNewModal} aria-label="Add new note" className="fab">
        <Plus size={24} />
      </button>

      {/* Modal */}
      {modalOpen && (
        <div
          className="modal-overlay animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="modal animate-pop-in">
            <h2 className="modal-title">
              {modalMode === "new" ? "NEW NOTE" : "EDIT NOTE"}
            </h2>

            <input
              ref={inputRef}
              type="text"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyModal();
                if (e.key === "Escape") closeModal();
              }}
              placeholder="Input your note..."
              className="modal-input"
            />

            <div className="modal-actions">
              <button onClick={closeModal} className="modal-btn cancel">
                CANCEL
              </button>
              <button
                onClick={applyModal}
                disabled={!draftText.trim()}
                className="modal-btn apply"
              >
                APPLY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
