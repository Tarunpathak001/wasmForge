function StatusChip({ tone = "default", children }) {
  const palette = {
    default: {
      color: "var(--ide-shell-text)",
      background: "var(--ide-shell-panel)",
      border: "var(--ide-shell-border)",
    },
    success: {
      color: "var(--ide-shell-success)",
      background: "color-mix(in srgb, var(--ide-shell-success) 14%, var(--ide-shell-panel))",
      border: "color-mix(in srgb, var(--ide-shell-success) 28%, transparent)",
    },
    warning: {
      color: "var(--ide-shell-warning)",
      background: "color-mix(in srgb, var(--ide-shell-warning) 14%, var(--ide-shell-panel))",
      border: "color-mix(in srgb, var(--ide-shell-warning) 28%, transparent)",
    },
    danger: {
      color: "var(--ide-shell-danger)",
      background: "color-mix(in srgb, var(--ide-shell-danger) 14%, var(--ide-shell-panel))",
      border: "color-mix(in srgb, var(--ide-shell-danger) 28%, transparent)",
    },
    accent: {
      color: "var(--ide-shell-accent)",
      background: "color-mix(in srgb, var(--ide-shell-accent) 14%, var(--ide-shell-panel))",
      border: "color-mix(in srgb, var(--ide-shell-accent) 28%, transparent)",
    },
  };

  const style = palette[tone] || palette.default;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 9px",
        borderRadius: "999px",
        border: `1px solid ${style.border}`,
        background: style.background,
        color: style.color,
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

function CheckCard({ label, description, ok }) {
  return (
    <div
      style={{
        border: "1px solid var(--ide-shell-border)",
        borderRadius: "12px",
        padding: "14px",
        background: "var(--ide-shell-panel)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ color: "var(--ide-shell-text)", fontSize: "13px", fontWeight: 700 }}>
          {label}
        </div>
        <StatusChip tone={ok ? "success" : "warning"}>{ok ? "Ready" : "Pending"}</StatusChip>
      </div>
      <div style={{ marginTop: "8px", color: "var(--ide-shell-muted)", fontSize: "12px", lineHeight: 1.6 }}>
        {description}
      </div>
    </div>
  );
}

function ActionButton({ children, onClick, disabled = false, tone = "default" }) {
  const isAccent = tone === "accent";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: disabled
          ? "1px solid var(--ide-shell-border-strong)"
          : isAccent
            ? "1px solid color-mix(in srgb, var(--ide-shell-accent) 30%, transparent)"
            : "1px solid var(--ide-shell-border)",
        borderRadius: "8px",
        background: disabled
          ? "var(--ide-shell-subtle)"
          : isAccent
            ? "var(--ide-shell-accent)"
            : "var(--ide-shell-panel)",
        color: disabled
          ? "var(--ide-shell-muted-strong)"
          : isAccent
            ? "var(--ide-shell-accent-contrast)"
            : "var(--ide-shell-text)",
        padding: "10px 12px",
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function formatCheckedAt(timestamp) {
  if (!timestamp) {
    return "Checks have not run yet."
  }

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return "Checks have not run yet."
  }

  return `Checked ${new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    month: "short",
    day: "numeric",
  }).format(date)}`
}

export default function OfflineProofPanel({
  ready = false,
  checking = false,
  preparing = false,
  error = "",
  guidance = "",
  lastCheckedAt = null,
  checks = [],
  steps = [],
  workspaceName = "",
  activeWorkspace = "",
  onPrepare,
  onRefresh,
  onCopySteps,
  onClose,
}) {
  const overallTone = error ? "danger" : ready ? "success" : checking || preparing ? "warning" : "accent";

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "var(--ide-shell-output-bg)",
        color: "var(--ide-shell-text)",
        padding: "16px",
      }}
    >
      <div
        style={{
          border: "1px solid var(--ide-shell-border)",
          borderRadius: "16px",
          background: "var(--ide-shell-panel-strong)",
          padding: "18px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--ide-shell-text)", fontSize: "18px", fontWeight: 800 }}>
              Offline Proof
            </div>
            <div style={{ marginTop: "6px", color: "var(--ide-shell-muted)", fontSize: "13px", lineHeight: 1.6, maxWidth: "780px" }}>
              Prove that WasmForge survives Airplane Mode, hard refresh, interactive input, and multi-file Python imports without a server.
            </div>
          </div>

          <StatusChip tone={overallTone}>
            {error ? "Check failed" : ready ? "Ready for Airplane Mode" : checking ? "Checking" : preparing ? "Preparing" : "Setup required"}
          </StatusChip>
        </div>

        <div
          style={{
            marginTop: "16px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <ActionButton onClick={onPrepare} disabled={preparing} tone="accent">
            {preparing ? "Preparing demo..." : "Prepare Demo Workspace"}
          </ActionButton>
          <ActionButton onClick={onRefresh} disabled={checking}>
            {checking ? "Refreshing..." : "Refresh Checks"}
          </ActionButton>
          <ActionButton onClick={onCopySteps}>Copy Steps</ActionButton>
          <ActionButton onClick={onClose}>Close</ActionButton>
        </div>

        <div
          style={{
            marginTop: "16px",
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1px solid var(--ide-shell-border)",
            background: "var(--ide-shell-panel)",
          }}
        >
          <div style={{ color: "var(--ide-shell-text)", fontSize: "13px", fontWeight: 700 }}>
            {guidance}
          </div>
          <div style={{ marginTop: "6px", color: "var(--ide-shell-muted)", fontSize: "12px" }}>
            {formatCheckedAt(lastCheckedAt)}
            {workspaceName ? (
              <>
                {" "}
                • Demo workspace: <span style={{ color: "var(--ide-shell-text)" }}>{workspaceName}</span>
                {activeWorkspace === workspaceName ? " (active)" : ""}
              </>
            ) : null}
          </div>
          {error ? (
            <div style={{ marginTop: "8px", color: "var(--ide-shell-danger)", fontSize: "12px", lineHeight: 1.5 }}>
              {error}
            </div>
          ) : null}
        </div>

        <div
          style={{
            marginTop: "18px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          {checks.map((check) => (
            <CheckCard
              key={check.id}
              label={check.label}
              description={check.description}
              ok={check.ok}
            />
          ))}
        </div>

        <div
          style={{
            marginTop: "18px",
            border: "1px solid var(--ide-shell-border)",
            borderRadius: "14px",
            background: "var(--ide-shell-panel)",
            padding: "16px",
          }}
        >
          <div style={{ color: "var(--ide-shell-text)", fontSize: "14px", fontWeight: 800 }}>
            Demo steps
          </div>
          <div style={{ marginTop: "10px", display: "grid", gap: "10px" }}>
            {steps.map((step, index) => (
              <div key={step} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "999px",
                    display: "grid",
                    placeItems: "center",
                    background: "var(--ide-shell-accent-soft)",
                    color: "var(--ide-shell-accent)",
                    fontSize: "11px",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ color: "var(--ide-shell-muted)", fontSize: "13px", lineHeight: 1.6 }}>
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
