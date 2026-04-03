import '../monacoSetup.js'
import { useCallback, useEffect, useRef } from 'react'
import MonacoEditor from '@monaco-editor/react'
import { DEFAULT_PYTHON } from '../constants/defaultPython.js'

const DEFAULT_RECOVERY_STORAGE_KEY = 'wasmforge:pending-workspace-writes'
const WASMFORGE_EDITOR_THEME = 'wasmforge-night'

function defineWasmForgeTheme(monaco) {
  monaco.editor.defineTheme(WASMFORGE_EDITOR_THEME, {
    base: 'vs-dark',
    inherit: true,
    semanticHighlighting: true,
    colors: {
      'editor.background': '#181a20',
      'editor.foreground': '#d4d8df',
      'editorLineNumber.foreground': '#5d6571',
      'editorLineNumber.activeForeground': '#cbd3dd',
      'editorCursor.foreground': '#d4d4d4',
      'editor.selectionBackground': '#264f78',
      'editor.inactiveSelectionBackground': '#223645',
      'editor.lineHighlightBackground': '#20242d',
      'editor.lineHighlightBorder': '#00000000',
      'editorIndentGuide.background1': '#252932',
      'editorIndentGuide.activeBackground1': '#3a4150',
      'editorWhitespace.foreground': '#2b313b',
      'editorBracketHighlight.foreground1': '#d4d4d4',
      'editorBracketHighlight.foreground2': '#4fc1ff',
      'editorBracketHighlight.foreground3': '#c586c0',
      'editorBracketHighlight.foreground4': '#4ec9b0',
      'editorBracketMatch.background': '#253240',
      'editorBracketMatch.border': '#3c5873',
      'editor.findMatchBackground': '#3b5170',
      'editor.findMatchHighlightBackground': '#263244',
      'editor.wordHighlightBackground': '#223140',
      'editor.wordHighlightStrongBackground': '#2a4050',
      'editorHoverWidget.background': '#1c2027',
      'editorHoverWidget.border': '#2a2f36',
      'editorWidget.background': '#1c2027',
      'editorWidget.border': '#2a2f36',
      'editorSuggestWidget.background': '#1c2027',
      'editorSuggestWidget.border': '#2a2f36',
      'editorSuggestWidget.selectedBackground': '#253242',
      'editorSuggestWidget.highlightForeground': '#56b6ff',
      'editorGutter.background': '#181a20',
      'scrollbarSlider.background': '#2b313a88',
      'scrollbarSlider.hoverBackground': '#3a424c99',
      'scrollbarSlider.activeBackground': '#4b5663aa',
      'minimap.background': '#181a20',
    },
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'C586C0' },
      { token: 'keyword.control', foreground: 'C586C0' },
      { token: 'storage', foreground: 'C586C0' },
      { token: 'storage.type', foreground: 'C586C0' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'string.escape', foreground: 'D7BA7D' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'constant.numeric', foreground: 'B5CEA8' },
      { token: 'constant.language', foreground: '569CD6' },
      { token: 'regexp', foreground: 'D16969' },
      { token: 'operator', foreground: 'D4D4D4' },
      { token: 'delimiter', foreground: '8B949E' },
      { token: 'delimiter.bracket', foreground: 'D4D4D4' },
      { token: 'entity.name.function', foreground: 'DCDCAA' },
      { token: 'support.function', foreground: 'DCDCAA' },
      { token: 'variable.parameter', foreground: '9CDCFE' },
      { token: 'entity.name.type', foreground: '4EC9B0' },
      { token: 'support.type', foreground: '4EC9B0' },
      { token: 'type.identifier', foreground: '4EC9B0' },
      { token: 'namespace', foreground: '4FC1FF' },
    ],
  })
}

function persistDraft(filename, content, storageKey = DEFAULT_RECOVERY_STORAGE_KEY) {
  if (typeof window === 'undefined' || !filename) {
    return
  }

  try {
    const raw = window.localStorage.getItem(storageKey)
    const drafts = raw ? JSON.parse(raw) : {}
    const nextDrafts = drafts && typeof drafts === 'object' && !Array.isArray(drafts)
      ? drafts
      : {}

    nextDrafts[filename] = content
    window.localStorage.setItem(storageKey, JSON.stringify(nextDrafts))
  } catch {
    // Recovery storage is best-effort only.
  }
}

function Editor({
  code,
  filename,
  onChange,
  onMount,
  language = 'python',
  readOnly = false,
  draftStorageKey = DEFAULT_RECOVERY_STORAGE_KEY,
}) {
  const editorRef = useRef(null)
  const modelChangeDisposableRef = useRef(null)
  const filenameRef = useRef(filename)

  useEffect(() => {
    filenameRef.current = filename
  }, [filename])

  useEffect(() => {
    return () => {
      modelChangeDisposableRef.current?.dispose()
      modelChangeDisposableRef.current = null
    }
  }, [])

  const handleMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    modelChangeDisposableRef.current?.dispose()
    modelChangeDisposableRef.current = editor.onDidChangeModelContent(() => {
      persistDraft(filenameRef.current, editor.getValue(), draftStorageKey)
    })

    onMount?.(editor, monaco)
  }, [draftStorageKey, onMount])

  const handleBeforeMount = useCallback((monaco) => {
    defineWasmForgeTheme(monaco)
  }, [])

  return (
    <MonacoEditor
      height="100%"
      language={language}
      path={filename}
      value={code}
      onChange={(val) => {
        const nextValue = val ?? ''
        persistDraft(filenameRef.current, nextValue, draftStorageKey)
        onChange?.(nextValue)
      }}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      theme={WASMFORGE_EDITOR_THEME}
      options={{
        fontSize: 14,
        lineHeight: 22,
        fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", Consolas, monospace',
        fontLigatures: true,
        readOnly,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        lineNumbersMinChars: 3,
        renderLineHighlight: 'line',
        cursorBlinking: 'phase',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        padding: { top: 18, bottom: 18 },
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
        wordWrap: 'on',
        roundedSelection: false,
        glyphMargin: false,
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        renderWhitespace: 'selection',
        matchBrackets: 'always',
        bracketPairColorization: { enabled: true },
        guides: {
          indentation: false,
          highlightActiveIndentation: false,
          bracketPairs: true,
          highlightActiveBracketPair: true,
        },
        scrollbar: {
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
          alwaysConsumeMouseWheel: false,
        },
        suggest: { showKeywords: true },
        quickSuggestions: true,
      }}
    />
  )
}

export { DEFAULT_PYTHON }
export default Editor
