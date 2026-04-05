import { useEffect, useState } from 'react'
import { getSqlEngineLabel } from '../utils/sqlRuntime.js'
import SchemaInspector from './SchemaInspector.jsx'

const PANEL_BG = 'var(--ide-shell-output-bg)'
const PANEL_SURFACE = 'var(--ide-shell-panel-strong)'
const PANEL_SUBTLE = 'var(--ide-shell-panel)'
const PANEL_BORDER = 'var(--ide-shell-border)'
const PANEL_BORDER_STRONG = 'var(--ide-shell-border-strong)'
const PANEL_TEXT = 'var(--ide-shell-text)'
const PANEL_MUTED = 'var(--ide-shell-muted)'
const PANEL_ROW_ALT = 'color-mix(in srgb, var(--ide-shell-accent-soft) 50%, var(--ide-shell-panel))'
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

function formatCellValue(value) {
  if (value === null || value === undefined) {
    return 'NULL'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return String(value)
}

function compareValues(left, right) {
  if (left === right) {
    return 0
  }

  if (left === null || left === undefined) {
    return 1
  }

  if (right === null || right === undefined) {
    return -1
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right
  }

  return formatCellValue(left).localeCompare(formatCellValue(right), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

function sortRows(rows, sortConfig) {
  if (!sortConfig) {
    return rows
  }

  const { columnIndex, direction } = sortConfig
  const directionMultiplier = direction === 'desc' ? -1 : 1

  return [...rows].sort((left, right) => {
    const result = compareValues(left[columnIndex], right[columnIndex])
    return result * directionMultiplier
  })
}

function ResultTable({ resultSet, sortConfig, onSort }) {
  const sortedRows = sortRows(resultSet.rows, sortConfig)

  return (
    <div
      style={{
        border: `1px solid ${PANEL_BORDER}`,
        borderRadius: '10px',
        overflow: 'hidden',
        background: PANEL_BG,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 14px',
          borderBottom: `1px solid ${PANEL_BORDER}`,
          background: PANEL_SUBTLE,
        }}
      >
        <div>
          <div style={{ color: PANEL_TEXT, fontWeight: 700, fontSize: '13px' }}>
            {resultSet.title}
          </div>
          <div style={{ color: PANEL_MUTED, fontSize: '12px', marginTop: '2px' }}>
            {resultSet.rowCount} row{resultSet.rowCount === 1 ? '' : 's'}
            {typeof resultSet.affectedRows === 'number'
              ? ` • ${resultSet.affectedRows} affected`
              : ''}
          </div>
        </div>
        <span
          style={{
            color: resultSet.kind === 'summary' ? WARNING_TONE : ACCENT_TONE,
            background: resultSet.kind === 'summary' ? WARNING_BG : ACCENT_BG,
            border: `1px solid ${resultSet.kind === 'summary' ? WARNING_BORDER : ACCENT_BORDER}`,
            borderRadius: '8px',
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {resultSet.kind}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            color: PANEL_TEXT,
          }}
        >
          <thead>
            <tr>
              {resultSet.columns.map((column, columnIndex) => {
                const isActive = sortConfig?.columnIndex === columnIndex
                const direction = isActive ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'

                return (
                  <th
                    key={`${resultSet.id}-${columnIndex}`}
                    onClick={() => onSort(resultSet.id, columnIndex)}
                    style={{
                      position: 'sticky',
                      top: 0,
                      background: PANEL_SUBTLE,
                      color: isActive ? PANEL_TEXT : PANEL_MUTED,
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderBottom: `1px solid ${PANEL_BORDER}`,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontWeight: 700,
                    }}
                  >
                    <span>{column}</span>
                    <span style={{ marginLeft: '8px', color: isActive ? ACCENT_TONE : 'var(--ide-shell-muted-strong)' }}>
                      {direction}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {sortedRows.map((row, rowIndex) => (
              <tr
                key={`${resultSet.id}-row-${rowIndex}`}
                style={{
                  background: rowIndex % 2 === 0 ? PANEL_BG : PANEL_ROW_ALT,
                }}
              >
                {resultSet.columns.map((_, columnIndex) => (
                  <td
                    key={`${resultSet.id}-${rowIndex}-${columnIndex}`}
                    style={{
                      padding: '10px 12px',
                      borderBottom: `1px solid ${PANEL_BORDER}`,
                      verticalAlign: 'top',
                      fontFamily:
                        '"Cascadia Code", "Fira Code", "JetBrains Mono", Consolas, monospace',
                      color: PANEL_TEXT,
                      minWidth: '120px',
                    }}
                  >
                    {formatCellValue(row[columnIndex])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function SqlResultsPanel({
  activeFile,
  engine,
  result,
  isReady,
  isRunning,
  status,
  schema = null,
}) {
  const [sortState, setSortState] = useState({})
  const engineLabel = result?.engineLabel || getSqlEngineLabel(engine)
  const hasSchema = Boolean(schema?.tables?.length)

  useEffect(() => {
    setSortState({})
  }, [result?.executedAt, result?.filename])

  const handleSort = (resultId, columnIndex) => {
    setSortState((prev) => {
      const current = prev[resultId]
      const nextDirection =
        current?.columnIndex === columnIndex && current.direction === 'asc'
          ? 'desc'
          : 'asc'

      return {
        ...prev,
        [resultId]: {
          columnIndex,
          direction: nextDirection,
        },
      }
    })
  }

  const placeholderMessage = engine === 'sqlite'
    ? `Run ${activeFile || 'a .sql file'} to query a persistent SQLite database stored in the browser.`
    : `Run ${activeFile || 'a .pg file'} to query a persistent PostgreSQL database stored in the browser.`
  const errorTitle = result?.errorMeta?.kind === 'database_state'
    ? 'Database error'
    : result?.errorMeta?.kind === 'runtime'
      ? 'Engine error'
      : result?.errorMeta?.kind === 'persistence'
        ? 'Storage error'
        : result?.errorMeta?.kind === 'busy'
          ? 'Engine busy'
    : result?.errorMeta?.kind === 'killed'
      ? 'Execution stopped'
      : 'Query failed'
  const hasSuccessfulResult = Boolean(result && !result.error)

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        background: PANEL_BG,
        padding: '16px',
        color: PANEL_TEXT,
      }}
    >
      <div
      style={{
          border: `1px solid ${PANEL_BORDER}`,
          borderRadius: '14px',
          padding: '16px',
          background: PANEL_SURFACE,
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
          <div>
            <div style={{ color: PANEL_TEXT, fontSize: '16px', fontWeight: 800 }}>
              Query Results
            </div>
            <div style={{ color: PANEL_MUTED, fontSize: '12px', marginTop: '4px' }}>
              {status}
            </div>
          </div>

          <span
            style={{
              color: engine === 'sqlite' ? ACCENT_TONE : SUCCESS_TONE,
              background: engine === 'sqlite' ? ACCENT_BG : SUCCESS_BG,
              border: `1px solid ${engine === 'sqlite' ? ACCENT_BORDER : SUCCESS_BORDER}`,
              borderRadius: '10px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {engineLabel}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            marginTop: '16px',
          }}
        >
          <InfoTile label="Engine" value={engineLabel} tone={engine === 'sqlite' ? ACCENT_TONE : SUCCESS_TONE} />
          <InfoTile label="File" value={activeFile || 'No SQL file selected'} tone={WARNING_TONE} />
          <InfoTile
            label="Persistence"
            value="Browser storage (OPFS)"
            tone={WARNING_TONE}
          />
          <InfoTile
            label="Database"
            value={result?.databaseLabel || 'Created on first run'}
            tone="var(--ide-shell-text-soft)"
          />
        </div>
      </div>

      {hasSchema ? (
        <SchemaInspector schema={schema} />
      ) : null}

      {!isReady ? (
        <StateCard title="Preparing engine" body={status} tone={ACCENT_TONE} />
      ) : null}

      {isRunning ? (
        <StateCard title="Running query" body={`${engineLabel} is executing your SQL.`} tone={WARNING_TONE} />
      ) : null}

      {result?.recoveryMessage ? (
        <StateCard title="Database recovered" body={result.recoveryMessage} tone={WARNING_TONE} />
      ) : null}

      {result?.error ? (
        <StateCard title={errorTitle} body={result.error} tone={DANGER_TONE} />
      ) : null}

      {!result && !isRunning ? (
        <StateCard title="Ready for query" body={placeholderMessage} tone={PANEL_MUTED} />
      ) : null}

      {hasSuccessfulResult && result?.durationMs ? (
        <div style={{ color: PANEL_MUTED, fontSize: '12px', marginBottom: '12px' }}>
          Last run finished in {result.durationMs.toFixed(1)}ms.
        </div>
      ) : null}

      {hasSuccessfulResult && engine === 'sqlite' ? (
        <div style={{ color: PANEL_MUTED, fontSize: '12px', marginBottom: '12px' }}>
          {result.restoredFromOpfs
            ? `Restored ${result.databaseLabel} from OPFS before executing this query.`
            : `Created or updated ${result.databaseLabel} and persisted it back to OPFS after execution.`}
        </div>
      ) : null}

      {hasSuccessfulResult && engine === 'pglite' ? (
        <div style={{ color: PANEL_MUTED, fontSize: '12px', marginBottom: '12px' }}>
          {result.recoveryMessage
            ? `PostgreSQL storage was reset and rebuilt for ${result.databaseLabel} before this query completed.`
            : result.restoredFromOpfs
              ? `Restored ${result.databaseLabel} from native OPFS-backed PostgreSQL storage.`
              : `Created or refreshed ${result.databaseLabel} in native OPFS-backed PostgreSQL storage.`}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: '14px' }}>
        {result?.resultSets?.map((resultSet) => (
          <ResultTable
            key={resultSet.id}
            resultSet={resultSet}
            sortConfig={sortState[resultSet.id]}
            onSort={handleSort}
          />
        ))}
      </div>
    </div>
  )
}

function InfoTile({ label, value, tone }) {
  return (
    <div
      style={{
        border: `1px solid ${PANEL_BORDER}`,
        borderRadius: '10px',
        padding: '12px',
        background: PANEL_BG,
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

function StateCard({ title, body, tone }) {
  return (
    <div
      style={{
        border: `1px solid color-mix(in srgb, ${tone} 26%, transparent)`,
        borderLeft: `3px solid ${tone}`,
        borderRadius: '10px',
        padding: '14px 16px',
        background: PANEL_SURFACE,
        marginBottom: '14px',
      }}
    >
      <div style={{ color: PANEL_TEXT, fontSize: '13px', fontWeight: 700 }}>
        {title}
      </div>
      <div style={{ color: PANEL_MUTED, fontSize: '12px', marginTop: '5px', lineHeight: 1.5 }}>
        {body}
      </div>
    </div>
  )
}
