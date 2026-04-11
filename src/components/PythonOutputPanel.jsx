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

function normalizeTables(tables) {
  if (!Array.isArray(tables)) {
    return []
  }

  return tables
    .map((table, index) => {
      const columns = Array.isArray(table?.columns)
        ? table.columns.map((column) => String(column ?? ''))
        : []
      const rows = Array.isArray(table?.rows)
        ? table.rows.map((row) => (Array.isArray(row) ? row : []))
        : []

      if (columns.length === 0 && rows.length === 0) {
        return null
      }

      return {
        id: String(table?.id || `display-${index + 1}`).trim() || `display-${index + 1}`,
        kind: String(table?.kind || 'dataframe').trim().toLowerCase() || 'dataframe',
        title: String(table?.title || `Display ${index + 1}`).trim() || `Display ${index + 1}`,
        columns,
        rows,
        index: Array.isArray(table?.index) ? table.index : [],
        rowCount: Number.isFinite(table?.rowCount) ? Number(table.rowCount) : rows.length,
        columnCount: Number.isFinite(table?.columnCount) ? Number(table.columnCount) : columns.length,
        truncatedRows: Number.isFinite(table?.truncatedRows) ? Number(table.truncatedRows) : 0,
        truncatedColumns: Number.isFinite(table?.truncatedColumns) ? Number(table.truncatedColumns) : 0,
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

function formatCellValue(value) {
  if (value === null || value === undefined) {
    return 'null'
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return String(value)
}

function getStatusTone({ isReady, isRunning, hasError, hasFigures, hasTables }) {
  if (hasError) {
    return DANGER_TONE
  }
  if (isRunning) {
    return WARNING_TONE
  }
  if (hasFigures || hasTables) {
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

function TablePreviewButton({ table, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '8px',
        width: '100%',
        borderRadius: '12px',
        border: `1px solid ${active ? ACCENT_BORDER : PANEL_BORDER}`,
        background: active ? ACCENT_BG : PANEL_BG,
        padding: '12px',
        cursor: 'pointer',
        textAlign: 'left',
        color: PANEL_TEXT,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%' }}>
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
            {table.title}
          </div>
          <div style={{ color: PANEL_MUTED, fontSize: '11px', marginTop: '2px' }}>
            {table.kind === 'series' ? 'Series output' : 'DataFrame output'}
          </div>
        </div>
        <Chip tone={active ? 'accent' : 'default'}>
          {table.rowCount}×{table.columnCount}
        </Chip>
      </div>
      <div style={{ color: PANEL_MUTED, fontSize: '12px', lineHeight: 1.6 }}>
        {table.columns.slice(0, 4).join(', ')}
        {table.columns.length > 4 ? '…' : ''}
      </div>
    </button>
  )
}

function DataTableView({ table, fileLabel }) {
  const hasIndex = Array.isArray(table.index) && table.index.length === table.rows.length

  return (
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
            <div role="heading" aria-level={3} style={{ color: PANEL_TEXT, fontSize: '14px', fontWeight: 800 }}>
              DataFrame Preview
            </div>
          <div style={{ color: PANEL_MUTED, fontSize: '12px', marginTop: '4px' }}>
            {table.title}
          </div>
        </div>
        <Chip tone="success">
          {table.kind === 'series' ? 'Series' : 'DataFrame'}
        </Chip>
      </div>

      <div style={{ padding: '14px' }}>
        <div
          style={{
            overflowX: 'auto',
            borderRadius: '12px',
            border: `1px solid ${PANEL_BORDER}`,
            background: PANEL_BG,
          }}
        >
          <table
            aria-label={`DataFrame ${table.title}`}
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '420px',
            }}
          >
            <thead>
              <tr style={{ background: PANEL_SUBTLE }}>
                {hasIndex ? (
                  <th
                    scope="col"
                    style={{
                      padding: '10px 12px',
                      borderBottom: `1px solid ${PANEL_BORDER}`,
                      borderRight: `1px solid ${PANEL_BORDER}`,
                      color: PANEL_MUTED_STRONG,
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      textAlign: 'left',
                    }}
                  >
                    Index
                  </th>
                ) : null}
                {table.columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    style={{
                      padding: '10px 12px',
                      borderBottom: `1px solid ${PANEL_BORDER}`,
                      borderRight: `1px solid ${PANEL_BORDER}`,
                      color: PANEL_MUTED_STRONG,
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      textAlign: 'left',
                    }}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={`${table.id}-row-${rowIndex}`}>
                  {hasIndex ? (
                    <td
                      style={{
                        padding: '10px 12px',
                        borderBottom: `1px solid ${PANEL_BORDER}`,
                        borderRight: `1px solid ${PANEL_BORDER}`,
                        color: PANEL_MUTED_STRONG,
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatCellValue(table.index[rowIndex])}
                    </td>
                  ) : null}
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${table.id}-row-${rowIndex}-cell-${cellIndex}`}
                      style={{
                        padding: '10px 12px',
                        borderBottom: `1px solid ${PANEL_BORDER}`,
                        borderRight: `1px solid ${PANEL_BORDER}`,
                        color: PANEL_TEXT,
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatCellValue(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: '12px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '10px',
          }}
        >
          <MetaTile label="Rows" value={String(table.rowCount)} tone={ACCENT_TONE} />
          <MetaTile label="Columns" value={String(table.columnCount)} tone={PANEL_MUTED_STRONG} />
          <MetaTile label="Source" value={fileLabel} tone={PANEL_MUTED_STRONG} />
        </div>

        {table.truncatedRows > 0 || table.truncatedColumns > 0 ? (
          <div
            style={{
              marginTop: '12px',
              color: PANEL_MUTED,
              fontSize: '12px',
              lineHeight: 1.6,
            }}
          >
            Preview limited to the first {table.rowCount - table.truncatedRows} row{table.rowCount - table.truncatedRows === 1 ? '' : 's'}
            {table.truncatedColumns > 0
              ? ` and ${table.columnCount - table.truncatedColumns} column${table.columnCount - table.truncatedColumns === 1 ? '' : 's'}`
              : ''}
            . Full shape is {table.rowCount}×{table.columnCount}.
          </div>
        ) : null}
      </div>
    </div>
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
  const tables = useMemo(() => normalizeTables(result?.tables), [result?.tables])
  const [selectedFigureId, setSelectedFigureId] = useState(null)
  const [selectedTableId, setSelectedTableId] = useState(null)

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

  useEffect(() => {
    if (tables.length === 0) {
      setSelectedTableId(null)
      return
    }

    setSelectedTableId((current) => {
      if (current && tables.some((table) => table.id === current)) {
        return current
      }
      return tables[0].id
    })
  }, [tables, result?.executedAt, result?.filename])

  const selectedFigure = figures.find((figure) => figure.id === selectedFigureId) || figures[0] || null
  const selectedTable = tables.find((table) => table.id === selectedTableId) || tables[0] || null
  const hasError = Boolean(result?.error)
  const hasFigures = figures.length > 0
  const hasTables = tables.length > 0
  const durationLabel = formatDuration(result?.durationMs)
  const executedAtLabel = formatTimestamp(result?.executedAt)
  const fileLabel = result?.filename || activeFile || 'No Python file selected'
  const statusTone = getStatusTone({ isReady, isRunning, hasError, hasFigures, hasTables })
  const localExecutionLabel = durationLabel
    ? `Executed on this device in ${durationLabel}`
    : isRunning
      ? 'Python is executing inside a local browser worker.'
      : 'Python runs inside a local browser worker on this device.'
  const richOutputTone = hasError
    ? 'danger'
    : isRunning
      ? 'warning'
      : hasTables && hasFigures
        ? 'success'
        : hasTables
          ? 'success'
          : hasFigures
            ? 'success'
            : 'accent'
  const richOutputLabel = hasError
    ? 'Error'
    : isRunning
      ? 'Running'
      : hasTables && hasFigures
        ? 'Rich output'
        : hasTables
          ? 'Tables ready'
          : hasFigures
            ? 'Figures ready'
            : 'Idle'
  const emptyMessage = activeFile
    ? `Run ${activeFile} and call display(df) or matplotlib.pyplot.show() to render structured Python output here.`
    : 'Run a Python file that calls display(df) or matplotlib.pyplot.show() to render structured output here.'

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
            <div role="heading" aria-level={2} style={{ color: PANEL_TEXT, fontSize: '16px', fontWeight: 800 }}>
              Python Output
            </div>
            <div style={{ color: PANEL_MUTED, fontSize: '12px', marginTop: '4px' }}>
              {status}
            </div>
          </div>

          <Chip tone={richOutputTone}>
            {richOutputLabel}
          </Chip>
        </div>

        {!hasError ? (
          <div
            style={{
              marginTop: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <Chip tone={durationLabel ? 'accent' : isRunning ? 'warning' : 'default'}>Local runtime</Chip>
            <span style={{ color: PANEL_MUTED_STRONG, fontSize: '12px', lineHeight: 1.5 }}>
              {localExecutionLabel}
            </span>
          </div>
        ) : null}

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
          body="Python is still executing. Structured output will appear here as soon as the worker finishes."
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

      {!hasError && !isRunning && !hasTables && !hasFigures ? (
        <StateCard
          title="No structured output yet"
          body={emptyMessage}
          tone={PANEL_MUTED_STRONG}
        />
      ) : null}

      {hasTables ? (
        <div style={{ display: 'grid', gap: '14px', marginTop: hasError || isRunning ? '16px' : 0 }}>
          {selectedTable ? (
            <DataTableView table={selectedTable} fileLabel={fileLabel} />
          ) : null}

          {tables.length > 1 ? (
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
                <div role="heading" aria-level={3} style={{ color: PANEL_TEXT, fontSize: '14px', fontWeight: 800 }}>
                  Display Stack
                </div>
                <div style={{ color: PANEL_MUTED, fontSize: '12px', marginTop: '4px' }}>
                  Switch between captured DataFrame and Series outputs.
                </div>
              </div>
              <div style={{ display: 'grid', gap: '12px', padding: '14px' }}>
                {tables.map((table) => (
                  <TablePreviewButton
                    key={table.id}
                    table={table}
                    active={table.id === selectedTableId}
                    onClick={() => setSelectedTableId(table.id)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {hasFigures ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: figures.length > 1 ? 'minmax(280px, 1.2fr) minmax(220px, 0.8fr)' : '1fr',
            gap: '14px',
            alignItems: 'start',
            marginTop: hasTables ? '16px' : 0,
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
                <div role="heading" aria-level={3} style={{ color: PANEL_TEXT, fontSize: '14px', fontWeight: 800 }}>
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
                <div role="heading" aria-level={3} style={{ color: PANEL_TEXT, fontSize: '14px', fontWeight: 800 }}>
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
