import { useEffect, useMemo, useRef, useState } from "react";

function FileTree({
  files,
  activeFile,
  activeWorkspace,
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
      style={{
        width: "100%",
        height: "100%",
        background: "#171a1f",
        color: "#d4d4d4",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "8px 12px 12px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
          background: "#171b21",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            color: "#bbbbbb",
            fontSize: "10px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          Explorer
        </div>

        <div
          style={{
            marginTop: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
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
            style={workspaceToggleButtonStyle(disabled)}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "999px",
                background: "#007acc",
                flexShrink: 0,
                marginTop: "4px",
              }}
            />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  color: "#d4d4d4",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {activeWorkspace}
              </span>
              <span
                style={{
                  display: "block",
                  marginTop: "2px",
                  color: "#6f7680",
                  fontSize: "10px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {orderedFiles.length} file{orderedFiles.length === 1 ? "" : "s"} · {sortedWorkspaces.length} workspace{sortedWorkspaces.length === 1 ? "" : "s"}
              </span>
            </span>
            <span
              style={{
                color: "#6f7680",
                fontSize: "10px",
                transform: workspaceMenuOpen ? "rotate(180deg)" : "none",
                transition: "transform 120ms ease",
              }}
            >
              ▾
            </span>
          </button>

          <button
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
            style={headerIconButtonStyle(disabled)}
          >
            <span style={{ fontSize: "16px", lineHeight: 1, transform: "translateY(-1px)" }}>+</span>
          </button>
        </div>

        <div
          style={{
            marginTop: "10px",
            color: "#707782",
            fontSize: "10px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          Files
        </div>

        {workspaceMenuOpen ? (
          <div ref={workspaceMenuRef} style={workspaceMenuStyle}>
            <div style={menuSectionLabelStyle}>Workspaces</div>

            <div style={{ display: "grid", gap: "4px", maxHeight: "164px", overflowY: "auto", paddingRight: "2px" }}>
              {sortedWorkspaces.map((workspaceName) => {
                const isActive = workspaceName === activeWorkspace;
                return (
                  <button
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
                        height: "8px",
                        borderRadius: "999px",
                        background: isActive ? "#007acc" : "#5e5e62",
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
                  placeholder="sql-practice"
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

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "6px 0 10px", background: "#171a1f" }}>
        {isCreating ? (
          <InlineRow meta={getFileMeta(createName || "new.py")}>
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
              placeholder="new-file.py"
              spellCheck={false}
              style={inlineInputStyle}
            />
          </InlineRow>
        ) : null}

        {orderedFiles.length === 0 && !isCreating ? (
          <div style={{ padding: "18px 12px", color: "#7b838e", fontSize: "12px", lineHeight: 1.55 }}>
            No files in this workspace yet.
            <div style={{ marginTop: "6px", color: "#656b75", fontSize: "11px" }}>
              Use the plus button to create a file.
            </div>
          </div>
        ) : null}

        {orderedFiles.map((file) => (
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
      onClick={onSelect}
      onDoubleClick={onRenameStart}
      onContextMenu={onContextRequest}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        height: "28px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "0 8px 0 10px",
        margin: "0 6px",
        background: isActive ? "#20252d" : isHovered ? "#1b2027" : "transparent",
        color: isActive ? "#ffffff" : "#d4d4d4",
        cursor: disabled ? "default" : "pointer",
        borderRadius: "3px",
        boxShadow: isActive ? "inset 2px 0 0 #007acc" : "none",
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
              lineHeight: 1,
              color: isActive ? "#ffffff" : "#c5ccd4",
            }}
            title={file.name}
          >
            {file.name}
          </div>
        )}
      </div>

      <button
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
        background: hovered ? "rgba(255,255,255,0.04)" : "transparent",
        color: danger ? "#f48771" : "#d4d4d4",
        textAlign: "left",
        padding: "8px 10px",
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
        height: "28px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "0 8px 0 10px",
        margin: "0 6px",
        background: "#2a2d2e",
        borderRadius: "4px",
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
        width: "18px",
        height: "18px",
        borderRadius: "4px",
        display: "grid",
        placeItems: "center",
        background: meta.surface,
        color: meta.accent,
        fontSize: meta.label.length > 2 ? "7px" : "9px",
        fontWeight: 700,
        letterSpacing: "0.03em",
        flexShrink: 0,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
      }}
      aria-hidden="true"
    >
      {meta.label}
    </span>
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
      return { label: "PY", accent: "#7bc4ae", surface: "rgba(123, 196, 174, 0.12)" };
    case "js":
      return { label: "JS", accent: "#d6c472", surface: "rgba(214, 196, 114, 0.12)" };
    case "ts":
      return { label: "TS", accent: "#7eb5ff", surface: "rgba(126, 181, 255, 0.12)" };
    case "sql":
      return { label: "SQL", accent: "#b790d7", surface: "rgba(183, 144, 215, 0.12)" };
    case "pg":
      return { label: "PG", accent: "#83b7d6", surface: "rgba(131, 183, 214, 0.12)" };
    default:
      return { label: "TXT", accent: "#9da3aa", surface: "rgba(157, 163, 170, 0.1)" };
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
    border: "1px solid rgba(30,30,30,0.95)",
    background: "#1e232a",
    boxShadow: "0 18px 34px rgba(0, 0, 0, 0.42)",
    zIndex: 40,
    padding: "6px 0",
    borderRadius: "6px",
  };
}

const menuSectionLabelStyle = {
  color: "#bbbbbb",
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  marginBottom: "8px",
};

const inlineInputStyle = {
  width: "100%",
  border: "1px solid #007acc",
  background: "#1e1e1e",
  color: "#d4d4d4",
  fontFamily: '"Cascadia Code", Consolas, monospace',
  fontSize: "12px",
  padding: "4px 7px",
  outline: "none",
  boxSizing: "border-box",
  borderRadius: "4px",
};

const workspaceMenuStyle = {
  position: "absolute",
  top: "68px",
  left: "8px",
  right: "8px",
  border: "1px solid rgba(30,30,30,0.95)",
  background: "#1e232a",
  boxShadow: "0 18px 34px rgba(0, 0, 0, 0.42)",
  padding: "10px",
  zIndex: 30,
  borderRadius: "8px",
};

const workspaceInputStyle = {
  flex: 1,
  minWidth: 0,
  border: "1px solid rgba(255,255,255,0.05)",
  background: "#1e1e1e",
  color: "#d4d4d4",
  fontSize: "12px",
  padding: "6px 8px",
  outline: "none",
  borderRadius: "6px",
};

function workspaceCreateButtonStyle(disabled = false) {
  return {
    border: "none",
    background: disabled ? "#2a2d2e" : "#0e639c",
    color: "#ffffff",
    padding: "0 10px",
    fontSize: "12px",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1,
    borderRadius: "4px",
  };
}

function workspaceToggleButtonStyle(disabled = false) {
  return {
    flex: 1,
    minWidth: 0,
    border: "none",
    background: "transparent",
    color: "#d4d4d4",
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
    height: "28px",
    border: "1px solid transparent",
    background: active ? "#20252d" : "transparent",
    color: active ? "#ffffff" : "#d4d4d4",
    textAlign: "left",
    padding: "0 8px",
    cursor: "pointer",
    fontSize: "12px",
    borderRadius: "6px",
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
    color: disabled ? "#5f5f5f" : "#bbbbbb",
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
    width: "20px",
    height: "20px",
    border: "none",
    background: visible ? "rgba(255,255,255,0.03)" : "transparent",
    color: "#858585",
    cursor: "pointer",
    opacity: visible ? 1 : 0,
    transition: "opacity 120ms ease, background 120ms ease",
    flexShrink: 0,
    borderRadius: "3px",
  };
}

export default FileTree;
