import { useEffect, useMemo, useRef, useState } from "react";

function FileTree({
  files,
  activeFile,
  activeWorkspace,
  mode = "explorer",
  searchQuery = "",
  onSearchQueryChange,
  workspaces = [],
  onSelectWorkspace,
  onCreateWorkspace,
  onFileSelect,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
  disabled = false,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [editingName, setEditingName] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [workspaceDraftName, setWorkspaceDraftName] = useState("");
  const [workspaceFeedback, setWorkspaceFeedback] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const createInputRef = useRef(null);
  const editInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const menuRef = useRef(null);
  const workspaceMenuRef = useRef(null);
  const workspaceButtonRef = useRef(null);

  const orderedFiles = useMemo(
    () => [...files].sort((left, right) => left.name.localeCompare(right.name)),
    [files],
  );
  const sortedWorkspaces = useMemo(
    () => [...workspaces].sort((left, right) => left.localeCompare(right)),
    [workspaces],
  );
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visibleFiles = useMemo(() => {
    if (mode !== "search" || !normalizedSearchQuery) {
      return orderedFiles;
    }
    return orderedFiles.filter((file) => file.name.toLowerCase().includes(normalizedSearchQuery));
  }, [mode, normalizedSearchQuery, orderedFiles]);

  useEffect(() => {
    if (isCreating) {
      createInputRef.current?.focus();
      createInputRef.current?.select?.();
    }
  }, [isCreating]);

  useEffect(() => {
    if (editingName) {
      editInputRef.current?.focus();
      editInputRef.current?.select?.();
    }
  }, [editingName]);

  useEffect(() => {
    if (mode === "search") {
      searchInputRef.current?.focus();
      searchInputRef.current?.select?.();
    }
  }, [mode]);

  useEffect(() => {
    if (!contextMenu && !workspaceMenuOpen) {
      return undefined;
    }

    const closeMenus = (event) => {
      if (workspaceMenuOpen) {
        if (workspaceMenuRef.current?.contains(event.target)) {
          return;
        }
        if (workspaceButtonRef.current?.contains(event.target)) {
          return;
        }
      }

      if (contextMenu && menuRef.current?.contains(event.target)) {
        return;
      }

      setContextMenu(null);
      setWorkspaceMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setContextMenu(null);
        setWorkspaceMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", closeMenus);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", closeMenus);
    window.addEventListener("scroll", closeMenus, true);

    return () => {
      window.removeEventListener("pointerdown", closeMenus);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", closeMenus);
      window.removeEventListener("scroll", closeMenus, true);
    };
  }, [contextMenu, workspaceMenuOpen]);

  useEffect(() => {
    if (disabled) {
      setContextMenu(null);
      setWorkspaceMenuOpen(false);
    }
  }, [disabled]);

  useEffect(() => {
    if (editingName && !files.some((file) => file.name === editingName)) {
      setEditingName(null);
      setEditingValue("");
    }
  }, [editingName, files]);

  const openFileMenu = (filename, x, y) => {
    setWorkspaceMenuOpen(false);
    setContextMenu({ file: filename, x, y });
  };

  const handleCreateFile = async () => {
    const normalized = normalizeFileName(createName);
    if (!normalized) {
      setIsCreating(false);
      setCreateName("");
      return;
    }

    if (files.some((file) => file.name === normalized)) {
      return;
    }

    try {
      await onCreateFile?.(normalized);
      setIsCreating(false);
      setCreateName("");
    } catch {
      // Parent owns error messaging.
    }
  };

  const handleRenameSubmit = async () => {
    const normalized = normalizeFileName(editingValue);
    if (!editingName || !normalized || normalized === editingName) {
      setEditingName(null);
      setEditingValue("");
      return;
    }

    if (files.some((file) => file.name === normalized && file.name !== editingName)) {
      return;
    }

    try {
      await onRenameFile?.(editingName, normalized);
      setEditingName(null);
      setEditingValue("");
    } catch {
      // Parent owns error messaging.
    }
  };

  const handleWorkspaceCreate = async () => {
    const normalized = normalizeWorkspaceName(workspaceDraftName);
    if (!normalized || isCreatingWorkspace) {
      return;
    }

    setIsCreatingWorkspace(true);
    setWorkspaceFeedback("");

    try {
      await onCreateWorkspace?.(normalized);
      setWorkspaceDraftName("");
      setWorkspaceMenuOpen(false);
    } catch (error) {
      setWorkspaceFeedback(error?.message || String(error));
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  return (
    <div
      className="wf-file-tree"
      style={{
        width: "100%",
        height: "100%",
        background: "#111114",
        color: "#ececef",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>
        {`
          .wf-file-tree * {
            box-sizing: border-box;
          }

          .wf-file-tree .wf-sidebar-card,
          .wf-file-tree .wf-file-row,
          .wf-file-tree .wf-create-file-btn,
          .wf-file-tree .wf-workspace-entry {
            transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease, opacity 160ms ease;
          }

          .wf-file-tree ::-webkit-scrollbar {
            width: 8px;
          }

          .wf-file-tree ::-webkit-scrollbar-thumb {
            background: rgba(86, 86, 95, 0.38);
            border-radius: 3px;
          }
        `}
      </style>

      <div
        style={{
          padding: "12px 12px 14px",
          borderBottom: "1px solid #2a2a32",
          background: "#111114",
          flexShrink: 0,
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            color: "#8b8b96",
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {mode === "search" ? "Search" : "Explorer"}
        </div>

        <div
          className="wf-sidebar-card"
          style={{
            marginTop: "10px",
            padding: "10px 12px 12px",
            border: "1px solid #2a2a32",
            borderRadius: "4px",
            background: "#18181c",
            display: "grid",
            gap: "10px",
          }}
        >
          <button
            ref={workspaceButtonRef}
            type="button"
            aria-label="Workspace switcher"
            title={activeWorkspace}
            disabled={disabled}
            onClick={() => {
              if (disabled) {
                return;
              }
              setContextMenu(null);
              setWorkspaceFeedback("");
              setWorkspaceMenuOpen((prev) => !prev);
            }}
            style={workspaceCardButtonStyle(disabled)}
          >
            <div style={workspaceCardLabelStyle}>Workspace</div>
            <div
              style={{
                marginTop: "6px",
                color: "#ececef",
                fontSize: "15px",
                fontWeight: 700,
                letterSpacing: "0.01em",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {activeWorkspace}
            </div>
            <div style={workspaceCardMetaStyle}>
              <span>
                {orderedFiles.length} file{orderedFiles.length === 1 ? "" : "s"}
              </span>
              <span style={workspaceCardDotStyle} />
              <span>Stored locally</span>
            </div>
          </button>

          <button
            className="wf-create-file-btn"
            type="button"
            onClick={() => {
              if (disabled) {
                return;
              }
              setWorkspaceMenuOpen(false);
              setContextMenu(null);
              setEditingName(null);
              setCreateName("");
              setIsCreating(true);
            }}
            disabled={disabled}
            aria-label="Create file"
            title="Create file"
            style={createFileButtonStyle(disabled)}
          >
            <span
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "4px",
                display: "grid",
                placeItems: "center",
                background: "rgba(180,138,234,0.12)",
                fontSize: "13px",
                lineHeight: 1,
              }}
            >
              +
            </span>
            <span>Create File</span>
          </button>
        </div>

        <div
          style={{
            marginTop: "14px",
            color: "#8b8b96",
            fontSize: "10px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <span>{mode === "search" ? "Results" : "Files"}</span>
          <span style={{ color: "#56565f", fontSize: "9px", letterSpacing: "0.1em" }}>
            {mode === "search"
              ? `${visibleFiles.length} match${visibleFiles.length === 1 ? "" : "es"}`
              : `${orderedFiles.length} file${orderedFiles.length === 1 ? "" : "s"}`}
          </span>
        </div>

        {mode === "search" ? (
          <div
            style={{
              marginTop: "10px",
              padding: "12px 12px 10px",
              border: "1px solid #2a2a32",
              borderRadius: "4px",
              background: "#18181c",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <SearchGlyph />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => onSearchQueryChange?.(event.target.value)}
                placeholder="Search files in this workspace"
                spellCheck={false}
                style={searchInputStyle}
              />
            </div>
            <div
              style={{
                marginTop: "8px",
                color: "#8b8b96",
                fontSize: "11px",
                lineHeight: 1.5,
              }}
            >
              {normalizedSearchQuery
                ? `${visibleFiles.length} match${visibleFiles.length === 1 ? "" : "es"} in ${activeWorkspace}`
                : "Filter files by name or extension."}
            </div>
          </div>
        ) : null}

        {workspaceMenuOpen ? (
          <div ref={workspaceMenuRef} style={workspaceMenuStyle}>
            <div style={menuSectionLabelStyle}>Workspaces</div>

            <div style={{ display: "grid", gap: "4px", maxHeight: "164px", overflowY: "auto", paddingRight: "2px" }}>
              {sortedWorkspaces.map((workspaceName) => {
                const isActive = workspaceName === activeWorkspace;
                return (
                  <button
                    className="wf-workspace-entry"
                    key={workspaceName}
                    type="button"
                    onClick={() => {
                      if (!isActive) {
                        onSelectWorkspace?.(workspaceName);
                      }
                      setWorkspaceMenuOpen(false);
                    }}
                    style={workspaceMenuItemStyle(isActive)}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "2px",
                        borderRadius: "1px",
                        background: isActive ? "#b48aea" : "#56565f",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {workspaceName}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: "10px", paddingTop: "10px" }}>
              <div style={menuSectionLabelStyle}>New Workspace</div>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  value={workspaceDraftName}
                  onChange={(event) => {
                    setWorkspaceDraftName(event.target.value);
                    if (workspaceFeedback) {
                      setWorkspaceFeedback("");
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleWorkspaceCreate();
                    }
                  }}
                  placeholder="workspace-name"
                  style={workspaceInputStyle}
                />
                <button
                  type="button"
                  onClick={() => {
                    void handleWorkspaceCreate();
                  }}
                  disabled={isCreatingWorkspace || !normalizeWorkspaceName(workspaceDraftName)}
                  style={workspaceCreateButtonStyle(isCreatingWorkspace || !normalizeWorkspaceName(workspaceDraftName))}
                >
                  Add
                </button>
              </div>
              {workspaceFeedback ? (
                <div style={{ marginTop: "8px", color: "#f48771", fontSize: "11px", lineHeight: 1.4 }}>
                  {workspaceFeedback}
                </div>
              ) : (
                <div style={{ marginTop: "8px", color: "#858585", fontSize: "11px", lineHeight: 1.4 }}>
                  Keep names short. No slashes.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "10px 0 14px",
            background: "transparent",
          }}
        >
        {isCreating ? (
          <InlineRow meta={getFileMeta(createName || "new-file.txt")}>
            <input
              ref={createInputRef}
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleCreateFile();
                }
                if (event.key === "Escape") {
                  setIsCreating(false);
                  setCreateName("");
                }
              }}
              onBlur={() => {
                if (createName.trim()) {
                  void handleCreateFile();
                } else {
                  setIsCreating(false);
                  setCreateName("");
                }
              }}
              placeholder="new-file.txt"
              spellCheck={false}
              style={inlineInputStyle}
            />
          </InlineRow>
        ) : null}

        {orderedFiles.length === 0 && !isCreating ? (
          <div style={{ padding: "18px 12px", color: "#8b8b96", fontSize: "12px", lineHeight: 1.55 }}>
            Create a file to begin.
            <div style={{ marginTop: "6px", color: "#56565f", fontSize: "11px" }}>
              Files and runtime data persist locally.
            </div>
          </div>
        ) : null}

        {orderedFiles.length > 0 && visibleFiles.length === 0 ? (
          <div style={{ padding: "18px 12px", color: "#8b8b96", fontSize: "12px", lineHeight: 1.55 }}>
            No files match "{searchQuery}".
            <div style={{ marginTop: "6px", color: "#56565f", fontSize: "11px" }}>
              Try `main`, `.ts`, `.sql`, or `.pg`.
            </div>
          </div>
        ) : null}

        {visibleFiles.map((file) => (
          <FileItem
            key={file.name}
            file={file}
            isActive={file.name === activeFile}
            disabled={disabled}
            isEditing={editingName === file.name}
            editingValue={editingName === file.name ? editingValue : ""}
            onEditValueChange={setEditingValue}
            onRenameStart={() => {
              if (disabled) {
                return;
              }
              setContextMenu(null);
              setEditingName(file.name);
              setEditingValue(file.name);
            }}
            onRenameCancel={() => {
              setEditingName(null);
              setEditingValue("");
            }}
            onRenameSubmit={() => void handleRenameSubmit()}
            onDelete={() => void onDeleteFile?.(file.name)}
            onSelect={() => {
              if (!disabled) {
                onFileSelect(file.name);
              }
            }}
            onContextRequest={(event) => {
              if (disabled) {
                return;
              }
              event.preventDefault();
              openFileMenu(file.name, event.clientX, event.clientY);
            }}
            onMenuOpen={(event) => {
              if (disabled) {
                return;
              }
              event.stopPropagation();
              const bounds = event.currentTarget.getBoundingClientRect();
              openFileMenu(file.name, bounds.right - 12, bounds.bottom + 4);
            }}
            editInputRef={editingName === file.name ? editInputRef : null}
          />
        ))}
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: "10px 12px 12px",
          borderTop: "1px solid #2a2a32",
          background: "#111114",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#8b8b96",
            fontSize: "11px",
            lineHeight: 1.5,
          }}
        >
          <span style={{ width: "8px", height: "2px", borderRadius: "1px", background: "#7dd8b0", flexShrink: 0 }} />
          Saved locally
        </div>
      </div>

      {contextMenu ? (
        <div ref={menuRef} style={getContextMenuStyle(contextMenu)}>
          <MenuItem
            label="Open"
            onClick={() => {
              onFileSelect(contextMenu.file);
              setContextMenu(null);
            }}
          />
          <MenuItem
            label="Rename"
            onClick={() => {
              setEditingName(contextMenu.file);
              setEditingValue(contextMenu.file);
              setContextMenu(null);
            }}
          />
          <MenuItem
            label="Delete"
            danger
            onClick={() => {
              void onDeleteFile?.(contextMenu.file);
              setContextMenu(null);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function FileItem({
  file,
  isActive,
  disabled,
  isEditing,
  editingValue,
  onEditValueChange,
  onRenameStart,
  onRenameCancel,
  onRenameSubmit,
  onSelect,
  onContextRequest,
  onMenuOpen,
  editInputRef,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const meta = getFileMeta(file.name);

  return (
    <div
      className="wf-file-row"
      onClick={onSelect}
      onDoubleClick={onRenameStart}
      onContextMenu={onContextRequest}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        height: "34px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "0 9px 0 11px",
        margin: "0 8px",
        border: "1px solid",
        borderColor: isActive ? "rgba(180, 138, 234, 0.18)" : isHovered ? "rgba(255,255,255,0.06)" : "transparent",
        background: isActive ? "#18181c" : isHovered ? "#222228" : "transparent",
        color: isActive ? "#ececef" : "#c4c4cc",
        cursor: disabled ? "default" : "pointer",
        borderRadius: "4px",
        boxShadow: isActive ? "inset 2px 0 0 #b48aea" : "none",
        transition: "background 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
      }}
    >
      <FileGlyph meta={meta} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <input
            ref={editInputRef}
            value={editingValue}
            onChange={(event) => onEditValueChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void onRenameSubmit();
              }
              if (event.key === "Escape") {
                onRenameCancel();
              }
            }}
            onBlur={() => void onRenameSubmit()}
            spellCheck={false}
            style={inlineInputStyle}
          />
        ) : (
          <div
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: '"Cascadia Code", Consolas, monospace',
              fontSize: "12px",
              fontWeight: isActive ? 700 : 600,
              lineHeight: 1,
              color: isActive ? "#ececef" : "#c4c4cc",
            }}
            title={file.name}
          >
            {file.name}
          </div>
        )}
      </div>

      <button
        className="wf-file-row-action"
        type="button"
        onClick={onMenuOpen}
        onDoubleClick={(event) => event.stopPropagation()}
        style={fileActionButtonStyle(isHovered || isActive)}
        aria-label={`More actions for ${file.name}`}
        title="More actions"
      >
        ⋯
      </button>
    </div>
  );
}

function MenuItem({ label, onClick, danger = false }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        border: "none",
        background: hovered ? "rgba(255,255,255,0.05)" : "transparent",
        color: danger ? "#f48771" : "#ececef",
        textAlign: "left",
        padding: "9px 12px",
        fontSize: "12px",
        cursor: "pointer",
        transition: "background 120ms ease",
      }}
    >
      {label}
    </button>
  );
}

function InlineRow({ meta, children }) {
  return (
    <div
      style={{
        height: "32px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "0 9px 0 11px",
        margin: "0 8px",
        background: "#18181c",
        borderRadius: "4px",
        boxShadow: "inset 2px 0 0 #b48aea",
      }}
    >
      <FileGlyph meta={meta} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function FileGlyph({ meta }) {
  return (
    <span
      style={{
        width: "20px",
        height: "20px",
        borderRadius: "3px",
        display: "grid",
        placeItems: "center",
        background: meta.surface,
        color: meta.accent,
        fontSize: meta.label.length > 2 ? "7px" : "9px",
        fontWeight: 700,
        letterSpacing: "0.03em",
        flexShrink: 0,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
      }}
      aria-hidden="true"
    >
      {meta.label}
    </span>
  );
}

function SearchGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="6.75" cy="6.75" r="3.75" stroke="#8b8b96" strokeWidth="1.2" />
      <path d="m9.75 9.75 3 3" stroke="#8b8b96" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function normalizeFileName(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || trimmed.includes("/") || trimmed.includes("\\")) {
    return "";
  }
  return trimmed.replace(/^\/?workspace\//u, "");
}

function normalizeWorkspaceName(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || trimmed.includes("/") || trimmed.includes("\\")) {
    return "";
  }
  return trimmed;
}

function getFileMeta(filename) {
  const extension = filename.split(".").pop()?.toLowerCase() || "";

  switch (extension) {
    case "py":
      return { label: "PY", accent: "#7dd8b0", surface: "rgba(70, 110, 91, 0.34)" };
    case "js":
      return { label: "JS", accent: "#e8c872", surface: "rgba(91, 73, 33, 0.34)" };
    case "ts":
      return { label: "TS", accent: "#72b4e8", surface: "rgba(44, 72, 96, 0.34)" };
    case "sql":
      return { label: "SQL", accent: "#b48aea", surface: "rgba(78, 54, 97, 0.34)" };
    case "pg":
      return { label: "PG", accent: "#a88de8", surface: "rgba(66, 52, 88, 0.34)" };
    default:
      return { label: "TXT", accent: "#afb7c2", surface: "rgba(55, 61, 69, 0.42)" };
  }
}

function getContextMenuStyle(contextMenu) {
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 768;
  const left = Math.max(8, Math.min(contextMenu.x, viewportWidth - 176));
  const top = Math.max(8, Math.min(contextMenu.y, viewportHeight - 120));

  return {
    position: "fixed",
    left: `${left}px`,
    top: `${top}px`,
    minWidth: "160px",
    border: "1px solid #2a2a32",
    background: "#111114",
    boxShadow: "0 16px 30px rgba(0, 0, 0, 0.34)",
    zIndex: 40,
    padding: "6px 0",
    borderRadius: "4px",
  };
}

const menuSectionLabelStyle = {
  color: "#c4c4cc",
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  marginBottom: "8px",
};

const inlineInputStyle = {
  width: "100%",
  border: "1px solid rgba(180, 138, 234, 0.28)",
  background: "#09090b",
  color: "#ececef",
  fontFamily: '"Cascadia Code", Consolas, monospace',
  fontSize: "12px",
  padding: "5px 8px",
  outline: "none",
  boxSizing: "border-box",
  borderRadius: "3px",
};

const searchInputStyle = {
  flex: 1,
  minWidth: 0,
  border: "none",
  background: "transparent",
  color: "#ececef",
  fontSize: "12px",
  outline: "none",
  padding: 0,
};

const workspaceMenuStyle = {
  position: "absolute",
  top: "144px",
  left: "8px",
  right: "8px",
  border: "1px solid #2a2a32",
  background: "#111114",
  boxShadow: "0 16px 30px rgba(0, 0, 0, 0.34)",
  padding: "12px",
  zIndex: 30,
  borderRadius: "4px",
};

function workspaceCardButtonStyle(disabled = false) {
  return {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#ececef",
    padding: "0",
    textAlign: "left",
    cursor: disabled ? "default" : "pointer",
    display: "grid",
    gap: "8px",
    borderRadius: "4px",
    opacity: disabled ? 0.8 : 1,
  };
}

const workspaceCardLabelStyle = {
  color: "#8b8b96",
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  fontWeight: 700,
};

const workspaceCardMetaStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#8b8b96",
  fontSize: "10px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const workspaceCardDotStyle = {
  width: "6px",
  height: "2px",
  borderRadius: "1px",
  background: "#56565f",
  flexShrink: 0,
};

function createFileButtonStyle(disabled = false) {
  return {
    width: "100%",
    height: "34px",
    border: disabled ? "1px solid #2a2a32" : "1px solid rgba(180, 138, 234, 0.18)",
    background: disabled ? "#18181c" : "#222228",
    color: disabled ? "#8b8b96" : "#ececef",
    cursor: disabled ? "default" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "3px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.04em",
  };
}

const workspaceInputStyle = {
  flex: 1,
  minWidth: 0,
  border: "1px solid #2a2a32",
  background: "#09090b",
  color: "#ececef",
  fontSize: "12px",
  padding: "8px 10px",
  outline: "none",
  borderRadius: "4px",
};

function workspaceCreateButtonStyle(disabled = false) {
  return {
    border: "1px solid rgba(180, 138, 234, 0.18)",
    background: disabled ? "#222228" : "#b48aea",
    color: "#ffffff",
    padding: "0 12px",
    fontSize: "12px",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1,
    borderRadius: "3px",
    fontWeight: 700,
  };
}

function workspaceToggleButtonStyle(disabled = false) {
  return {
    flex: 1,
    minWidth: 0,
    border: "none",
    background: "transparent",
    color: "#ececef",
    padding: "2px 0 4px",
    textAlign: "left",
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    cursor: disabled ? "default" : "pointer",
  };
}

function workspaceMenuItemStyle(active = false) {
  return {
    height: "30px",
    border: `1px solid ${active ? "rgba(180, 138, 234, 0.18)" : "transparent"}`,
    background: active ? "#18181c" : "transparent",
    color: active ? "#ececef" : "#c4c4cc",
    textAlign: "left",
    padding: "0 10px",
    cursor: "pointer",
    fontSize: "12px",
    borderRadius: "3px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };
}

function headerIconButtonStyle(disabled = false) {
  return {
    width: "24px",
    height: "24px",
    border: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(255,255,255,0.02)",
    color: disabled ? "#56565f" : "#c4c4cc",
    cursor: disabled ? "default" : "pointer",
    fontSize: "16px",
    lineHeight: 1,
    padding: 0,
    borderRadius: "4px",
    flexShrink: 0,
  };
}

function fileActionButtonStyle(visible = false) {
  return {
    width: "22px",
    height: "22px",
    border: "1px solid rgba(255,255,255,0.04)",
    background: visible ? "#222228" : "transparent",
    color: "#8b8b96",
    cursor: "pointer",
    opacity: visible ? 1 : 0,
    transition: "opacity 120ms ease, background 120ms ease",
    flexShrink: 0,
    borderRadius: "3px",
  };
}

export default FileTree;
