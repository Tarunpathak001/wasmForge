import { useEffect, useMemo, useState } from 'react'

const PANEL_BG = 'var(--ide-shell-output-bg)'
const PANEL_SURFACE = 'var(--ide-shell-panel-strong)'
const PANEL_SUBTLE = 'var(--ide-shell-panel)'
const PANEL_BORDER = 'var(--ide-shell-border)'
const PANEL_BORDER_STRONG = 'var(--ide-shell-border-strong)'
const PANEL_TEXT = 'var(--ide-shell-text)'
const PANEL_MUTED = 'var(--ide-shell-muted)'
const ACCENT_TONE = 'var(--ide-shell-accent)'
const ACCENT_BG = 'color-mix(in srgb, var(--ide-shell-accent-soft) 78%, transparent)'
const ACCENT_BORDER = 'color-mix(in srgb, var(--ide-shell-accent) 26%, transparent)'
const WARNING_TONE = 'var(--ide-shell-warning)'
const WARNING_BG = 'color-mix(in srgb, var(--ide-shell-warning) 14%, transparent)'
const WARNING_BORDER = 'color-mix(in srgb, var(--ide-shell-warning) 26%, transparent)'
const SUCCESS_TONE = 'var(--ide-shell-success)'
const SUCCESS_BG = 'color-mix(in srgb, var(--ide-shell-success) 14%, transparent)'
const SUCCESS_BORDER = 'color-mix(in srgb, var(--ide-shell-success) 26%, transparent)'

function normalizeSchema(schema) {
  const tables = Array.isArray(schema?.tables) ? schema.tables : []

  return tables
    .map((table) => ({
      name: String(table?.name || 'unnamed_table'),
      type: String(table?.type || 'table'),
      columns: Array.isArray(table?.columns)
        ? table.columns.map((column) => ({
            name: String(column?.name || 'unnamed_column'),
            type: String(column?.type || 'unknown'),
          }))
        : [],
    }))
    .filter((table) => table.name.length > 0)
}

function Chevron({ open }) {
  return (
    <span
      style={{
        display: 'inline-block',
        transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 160ms ease',
        color: PANEL_MUTED,
        width: '14px',
        textAlign: 'center',
        fontSize: '11px',
      }}
    >
      ▶
    </span>
  )
}

function Pill({ children, tone = 'default' }) {
  const tones = {
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
    warm: {
      color: WARNING_TONE,
      background: WARNING_BG,
      border: WARNING_BORDER,
    },
    green: {
      color: SUCCESS_TONE,
      background: SUCCESS_BG,
      border: SUCCESS_BORDER,
    },
  }

  const style = tones[tone] || tones.default

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '8px',
        color: style.color,
        background: style.background,
        border: `1px solid ${style.border}`,
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function TreeRow({
  label,
  meta,
  open,
  onToggle,
  tone = 'default',
  indent = 0,
  icon,
  children,
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          marginLeft: `${indent * 16}px`,
          border: '1px solid transparent',
          borderRadius: '10px',
          background: open ? ACCENT_BG : 'transparent',
          color: PANEL_TEXT,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 160ms ease, border-color 160ms ease',
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.background = open ? ACCENT_BG : 'var(--ide-shell-hover)'
          event.currentTarget.style.borderColor = PANEL_BORDER
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.background = open ? ACCENT_BG : 'transparent'
          event.currentTarget.style.borderColor = 'transparent'
        }}
      >
        <Chevron open={open} />
        <span
          style={{
            minWidth: '28px',
            height: '28px',
            display: 'inline-grid',
            placeItems: 'center',
            borderRadius: '8px',
            background: PANEL_BG,
            border: `1px solid ${PANEL_BORDER}`,
            color:
              tone === 'accent'
                ? ACCENT_TONE
                : tone === 'warm'
                  ? WARNING_TONE
                  : tone === 'green'
                    ? SUCCESS_TONE
                    : PANEL_MUTED,
            fontSize: '12px',
            fontWeight: 800,
          }}
        >
          {icon}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              color: PANEL_TEXT,
              fontSize: '13px',
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
          <span
            style={{
              display: 'block',
              color: PANEL_MUTED,
              fontSize: '11px',
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {meta}
          </span>
        </span>
      </button>

      {open ? <div style={{ marginTop: '4px' }}>{children}</div> : null}
    </div>
  )
}

function ColumnRow({ column, indent = 0 }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginLeft: `${indent * 16 + 22}px`,
        padding: '8px 12px',
        borderLeft: `1px solid ${PANEL_BORDER}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: PANEL_TEXT,
            fontSize: '13px',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {column.name}
        </div>
        <div style={{ color: PANEL_MUTED, fontSize: '11px', marginTop: '2px' }}>
          Column
        </div>
      </div>

      <Pill tone="default">{column.type}</Pill>
    </div>
  )
}

export default function SchemaInspector({ schema }) {
  const tables = useMemo(() => normalizeSchema(schema), [schema])
  const [expandedTables, setExpandedTables] = useState(() => new Set())

  useEffect(() => {
    if (tables.length === 0) {
      setExpandedTables(new Set())
      return
    }

    setExpandedTables((current) => {
      const next = new Set(current)

      if (next.size === 0) {
        next.add(tables[0].name)
        return next
      }

      for (const table of tables) {
        if (next.has(table.name)) {
          return next
        }
      }

      next.add(tables[0].name)
      return next
    })
  }, [tables])

  const tableCount = tables.length
  const columnCount = tables.reduce((sum, table) => sum + table.columns.length, 0)

  if (tableCount === 0) {
    return (
      <div
        style={{
          border: `1px solid ${PANEL_BORDER}`,
          borderRadius: '14px',
          background: PANEL_SURFACE,
          marginBottom: '16px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px',
            borderBottom: `1px solid ${PANEL_BORDER}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ color: PANEL_TEXT, fontSize: '15px', fontWeight: 800 }}>
              Schema Inspector
            </div>
            <div style={{ color: PANEL_MUTED, fontSize: '12px', marginTop: '4px' }}>
              Waiting for SQL execution to expose a schema.
            </div>
          </div>
          <Pill tone="accent">Inactive</Pill>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        border: `1px solid ${PANEL_BORDER}`,
        borderRadius: '14px',
        background: PANEL_SURFACE,
        marginBottom: '16px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: `1px solid ${PANEL_BORDER}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ color: PANEL_TEXT, fontSize: '15px', fontWeight: 800 }}>
            Schema Inspector
          </div>
          <div style={{ color: PANEL_MUTED, fontSize: '12px', marginTop: '4px' }}>
            Auto-discovered from the latest SQL execution.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Pill tone="accent">{tableCount} tables</Pill>
          <Pill tone="warm">{columnCount} columns</Pill>
        </div>
      </div>

      <div style={{ padding: '12px' }}>
        <div
          style={{
            display: 'grid',
            gap: '10px',
          }}
        >
          {tables.map((table) => {
            const open = expandedTables.has(table.name)
            const columnSummary = `${table.columns.length} column${table.columns.length === 1 ? '' : 's'}`

            return (
              <TreeRow
                key={table.name}
                label={table.name}
                meta={columnSummary}
                open={open}
                tone="accent"
                icon={table.type === 'view' ? 'V' : 'T'}
                onToggle={() => {
                  setExpandedTables((current) => {
                    const next = new Set(current)
                    if (next.has(table.name)) {
                      next.delete(table.name)
                    } else {
                      next.add(table.name)
                    }
                    return next
                  })
                }}
              >
                <div
                  style={{
                    marginLeft: '14px',
                    paddingLeft: '12px',
                    borderLeft: `1px solid ${PANEL_BORDER}`,
                    display: 'grid',
                    gap: '6px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '2px 12px 6px 0',
                    }}
                  >
                    <span style={{ color: PANEL_MUTED, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Columns
                    </span>
                    <Pill tone={table.type === 'view' ? 'warm' : 'green'}>{table.type}</Pill>
                  </div>

                  {table.columns.length > 0 ? (
                    table.columns.map((column) => (
                      <ColumnRow key={`${table.name}-${column.name}`} column={column} indent={1} />
                    ))
                  ) : (
                    <div
                      style={{
                        marginLeft: '22px',
                        padding: '10px 12px',
                        color: PANEL_MUTED,
                        fontSize: '12px',
                        borderLeft: `1px dashed ${PANEL_BORDER_STRONG}`,
                      }}
                    >
                      No columns detected for this object.
                    </div>
                  )}
                </div>
              </TreeRow>
            )
          })}
        </div>
      </div>
    </div>
  )
}
