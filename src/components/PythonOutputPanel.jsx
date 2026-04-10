import { useEffect, useMemo, useState } from 'react'

const PANEL_BG = 'var(--ide-shell-output-bg)'
const PANEL_SURFACE = 'var(--ide-shell-panel-strong)'
const PANEL_SUBTLE = 'var(--ide-shell-panel)'
const PANEL_BORDER = 'var(--ide-shell-border)'
const PANEL_BORDER_STRONG = 'var(--ide-shell-border-strong)'
const PANEL_TEXT = 'var(--ide-shell-text)'
const PANEL_MUTED = 'var(--ide-shell-muted)'
const PANEL_MUTED_STRONG = 'var(--ide-shell-muted-strong)'
const ACCENT_TONE = 'var(--ide-shell-accent)'
const ACCENT_BG = 'color-mix(in srgb, var(--ide-shell-accent-soft) 78%, transparent)'
const ACCENT_BORDER = 'color-mix(in srgb, var(--ide-shell-accent) 26%, transparent)'
const SUCCESS_TONE = 'var(--ide-shell-success)'
const SUCCESS_BG = 'color-mix(in srgb, var(--ide-shell-success) 14%, transparent)'
const SUCCESS_BORDER = 'color-mix(in srgb, var(--ide-shell-success) 26%, transparent)'
const WARNING_TONE = 'var(--ide-shell-warning)'
const WARNING_BG = 'color-mix(in srgb, var(--ide-shell-warning) 14%, transparent)'
const WARNING_BORDER = 'color-mix(in srgb, var(--ide-shell-warning) 26%, transparent)'
const DANGER_TONE = 'var(--ide-shell-danger)'
const DANGER_BG = 'color-mix(in srgb, var(--ide-shell-danger) 14%, transparent)'
const DANGER_BORDER = 'color-mix(in srgb, var(--ide-shell-danger) 26%, transparent)'
const SOFT_GRID = 'linear-gradient(135deg, color-mix(in srgb, var(--ide-shell-border) 30%, transparent) 25%, transparent 25%, transparent 50%, color-mix(in srgb, var(--ide-shell-border) 30%, transparent) 50%, color-mix(in srgb, var(--ide-shell-border) 30%, transparent) 75%, transparent 75%, transparent)'

function normalizeFigures(figures) {
  if (!Array.isArray(figures)) {
    return []
  }

  return figures
    .map((figure, index) => {
      const dataUrl = typeof figure?.dataUrl === 'string' ? figure.dataUrl.trim() : ''
      if (!dataUrl) {
        return null
      }

      const id = String(figure?.id || `figure-${index + 1}`).trim() || `figure-${index + 1}`
      const format = String(figure?.format || 'png').trim().toLowerCase() || 'png'

      return {
        id,
        format,
        dataUrl,
      }
    })
    .filter(Boolean)
}

function formatDuration(durationMs) {
  if (typeof durationMs !== 'number' || !Number.isFinite(durationMs) || durationMs < 0) {
    return null
  }

  if (durationMs < 1000) {
    return `${durationMs.toFixed(1)}ms`
  }

  return `${(durationMs / 1000).toFixed(2)}s`
}

function formatTimestamp(executedAt) {
  if (!executedAt) {
    return null
  }

  const date = new Date(executedAt)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function getStatusTone({ isReady, isRunning, hasError, hasFigures }) {
  if (hasError) {
    return DANGER_TONE
  }
  if (isRunning) {
    return WARNING_TONE
  }
  if (hasFigures) {
    return SUCCESS_TONE
  }
  if (!isReady) {
    return ACCENT_TONE
  }
  return PANEL_MUTED_STRONG
}

function Chip({ children, tone = 'default' }) {
  const palette = {
    default: {
      color: PANEL_TEXT,
      background: PANEL_SUBTLE,
      border: PANEL_BORDER,
    },
    accent: {
      color: ACCENT_TONE,
      background: ACCENT_BG,
      border: ACCENT_BORDER,
    },
    success: {
      color: SUCCESS_TONE,
      background: SUCCESS_BG,
      border: SUCCESS_BORDER,
    },
    warning: {
      color: WARNING_TONE,
      background: WARNING_BG,
      border: WARNING_BORDER,
    },
    danger: {
      color: DANGER_TONE,
      background: DANGER_BG,
      border: DANGER_BORDER,
    },
  }

  const style = palette[tone] || palette.default

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '8px',
        border: `1px solid ${style.border}`,
        background: style.background,
        color: style.color,
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function StateCard({ title, body, tone, children }) {
  return (
    <div
      style={{
        border: `1px solid color-mix(in srgb, ${tone} 22%, transparent)`,
        borderLeft: `3px solid ${tone}`,
        borderRadius: '12px',
        background: PANEL_SURFACE,
        padding: '14px 16px',
      }}
    >
      <div style={{ color: PANEL_TEXT, fontSize: '13px', fontWeight: 700 }}>
        {title}
      </div>
      <div style={{ color: PANEL_MUTED, fontSize: '12px', lineHeight: 1.6, marginTop: '6px' }}>
        {body}
      </div>
      {children ? <div style={{ marginTop: '12px' }}>{children}</div> : null}
    </div>
  )
}

function MetaTile({ label, value, tone = PANEL_MUTED_STRONG }) {
  return (
    <div
      style={{
        border: `1px solid ${PANEL_BORDER}`,
        borderRadius: '10px',
        background: PANEL_BG,
        padding: '12px',
      }}
    >
      <div
        style={{
          color: tone,
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}
      >
        {label}
      </div>
      <div style={{ color: PANEL_TEXT, fontSize: '13px', fontWeight: 600 }}>
        {value}
      </div>
    </div>
  )
}

function FigurePreview({ figure, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        borderRadius: '12px',
        border: `1px solid ${active ? ACCENT_BORDER : PANEL_BORDER}`,
        background: active ? ACCENT_BG : PANEL_BG,
        padding: '10px',
        cursor: 'pointer',
        textAlign: 'left',
        color: PANEL_TEXT,
        transition: 'transform 160ms ease, border-color 160ms ease, background 160ms ease',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'translateY(0px)'
      }}
    >
      <div
        style={{
          borderRadius: '10px',
          overflow: 'hidden',
          border: `1px solid ${PANEL_BORDER}`,
          background: `linear-gradient(180deg, ${PANEL_BG} 0%, ${PANEL_SUBTLE} 100%)`,
        }}
      >
        <div
          style={{
            aspectRatio: '16 / 10',
            display: 'grid',
            placeItems: 'center',
            padding: '10px',
            backgroundImage: SOFT_GRID,
            backgroundSize: '18px 18px',
            backgroundColor: PANEL_BG,
          }}
        >
          <img
            src={figure.dataUrl}
            alt={`${figure.id} (${figure.format})`}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              borderRadius: '6px',
              background: PANEL_BG,
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              color: PANEL_TEXT,
              fontSize: '13px',
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {figure.id}
          </div>
          <div style={{ color: PANEL_MUTED, fontSize: '11px', marginTop: '2px' }}>
            Matplotlib figure
          </div>
        </div>
        <Chip tone={active ? 'accent' : 'default'}>{figure.format}</Chip>
      </div>
    </button>
  )
}

export default function PythonOutputPanel({
  activeFile,
  result,
  isReady,
  isRunning,
  status,
}) {
  const figures = useMemo(() => normalizeFigures(result?.figures), [result?.figures])
  const [selectedFigureId, setSelectedFigureId] = useState(null)

  useEffect(() => {
    if (figures.length === 0) {
      setSelectedFigureId(null)
      return
    }

    setSelectedFigureId((current) => {
      if (current && figures.some((figure) => figure.id === current)) {
        return current
      }
      return figures[0].id
    })
  }, [figures, result?.executedAt, result?.filename])

  const selectedFigure = figures.find((figure) => figure.id === selectedFigureId) || figures[0] || null
  const hasError = Boolean(result?.error)
  const hasFigures = figures.length > 0
  const durationLabel = formatDuration(result?.durationMs)
  const executedAtLabel = formatTimestamp(result?.executedAt)
  const fileLabel = result?.filename || activeFile || 'No Python file selected'
  const statusTone = getStatusTone({ isReady, isRunning, hasError, hasFigures })

  const emptyMessage = activeFile
    ? `Run ${activeFile} to render Matplotlib figures here.`
    : 'Run a Python file that calls matplotlib.pyplot.show() to render figures here.'

  const layout = figures.length > 1
    ? 'minmax(280px, 1.2fr) minmax(220px, 0.8fr)'
    : '1fr'

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        background: PANEL_BG,
        color: PANEL_TEXT,
        padding: '16px',
      }}
    >
      <div
        style={{
          border: `1px solid ${PANEL_BORDER}`,
          borderRadius: '14px',
          background: PANEL_SURFACE,
          padding: '16px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ color: PANEL_TEXT, fontSize: '16px', fontWeight: 800 }}>
              Python Output
            </div>
            <div style={{ color: PANEL_MUTED, fontSize: '12px', marginTop: '4px' }}>
              {status}
            </div>
          </div>

          <Chip tone={hasError ? 'danger' : isRunning ? 'warning' : hasFigures ? 'success' : 'accent'}>
            {hasError ? 'Error' : isRunning ? 'Running' : hasFigures ? 'Figures ready' : 'Idle'}
          </Chip>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            marginTop: '16px',
          }}
        >
          <MetaTile label="File" value={fileLabel} tone={PANEL_MUTED_STRONG} />
          <MetaTile label="Status" value={isReady ? 'Engine ready' : 'Preparing Python'} tone={statusTone} />
          <MetaTile label="Duration" value={durationLabel || 'Not available yet'} tone={PANEL_MUTED_STRONG} />
          <MetaTile label="Executed" value={executedAtLabel || 'Waiting for a run'} tone={PANEL_MUTED_STRONG} />
        </div>
      </div>

      {!isReady ? (
        <StateCard
          title="Preparing Python"
          body={status}
          tone={ACCENT_TONE}
        />
      ) : null}

      {isRunning ? (
        <StateCard
          title="Rendering output"
          body="Python is still executing. Figures will appear here as soon as the worker finishes."
          tone={WARNING_TONE}
        >
          <div
            aria-hidden="true"
            style={{
              height: '8px',
              borderRadius: '999px',
              background: PANEL_BG,
              overflow: 'hidden',
              border: `1px solid ${PANEL_BORDER}`,
            }}
          >
            <div
              style={{
                width: '38%',
                height: '100%',
                borderRadius: 'inherit',
                background: 'linear-gradient(90deg, var(--ide-shell-accent) 0%, var(--ide-shell-success) 100%)',
              }}
            />
          </div>
        </StateCard>
      ) : null}

      {hasError ? (
        <StateCard
          title="Python execution failed"
          body={result.error}
          tone={DANGER_TONE}
        />
      ) : null}

      {!hasError && !isRunning && !hasFigures ? (
        <StateCard
          title="No figures yet"
          body={emptyMessage}
          tone={PANEL_MUTED_STRONG}
        />
      ) : null}

      {hasFigures ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: layout,
            gap: '14px',
            alignItems: 'start',
          }}
        >
          <div
            style={{
              border: `1px solid ${PANEL_BORDER}`,
              borderRadius: '14px',
              background: PANEL_SURFACE,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderBottom: `1px solid ${PANEL_BORDER}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ color: PANEL_TEXT, fontSize: '14px', fontWeight: 800 }}>
                  Figure Preview
                </div>
                <div style={{ color: PANEL_MUTED, fontSize: '12px', marginTop: '4px' }}>
                  {selectedFigure ? selectedFigure.id : 'Select a figure'}
                </div>
              </div>
              <Chip tone="success">{figures.length} figure{figures.length === 1 ? '' : 's'}</Chip>
            </div>

            {selectedFigure ? (
              <div style={{ padding: '14px' }}>
                <div
                  style={{
                    border: `1px solid ${PANEL_BORDER}`,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: `linear-gradient(180deg, ${PANEL_BG} 0%, ${PANEL_SUBTLE} 100%)`,
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '16 / 10',
                      display: 'grid',
                      placeItems: 'center',
                      padding: '14px',
                      backgroundImage: SOFT_GRID,
                      backgroundSize: '20px 20px',
                      backgroundColor: PANEL_BG,
                    }}
                  >
                    <img
                      src={selectedFigure.dataUrl}
                      alt={`${selectedFigure.id} (${selectedFigure.format})`}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
                        borderRadius: '8px',
                        background: PANEL_BG,
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '10px',
                  }}
                >
                  <MetaTile label="Figure ID" value={selectedFigure.id} tone={ACCENT_TONE} />
                  <MetaTile label="Format" value={selectedFigure.format.toUpperCase()} tone={PANEL_MUTED_STRONG} />
                  <MetaTile label="Source" value={fileLabel} tone={PANEL_MUTED_STRONG} />
                </div>
              </div>
            ) : null}
          </div>

          {figures.length > 1 ? (
            <div
              style={{
                border: `1px solid ${PANEL_BORDER}`,
                borderRadius: '14px',
                background: PANEL_SURFACE,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: `1px solid ${PANEL_BORDER}`,
                }}
              >
                <div style={{ color: PANEL_TEXT, fontSize: '14px', fontWeight: 800 }}>
                  Gallery
                </div>
                <div style={{ color: PANEL_MUTED, fontSize: '12px', marginTop: '4px' }}>
                  Switch between generated figures.
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: '12px',
                  padding: '14px',
                }}
              >
                {figures.map((figure) => (
                  <FigurePreview
                    key={figure.id}
                    figure={figure}
                    active={figure.id === selectedFigureId}
                    onClick={() => setSelectedFigureId(figure.id)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
