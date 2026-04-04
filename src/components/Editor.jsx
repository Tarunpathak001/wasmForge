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
      'editor.background': '#09090b',
      'editor.foreground': '#ececef',
      'editorLineNumber.foreground': '#56565f',
      'editorLineNumber.activeForeground': '#d4ccdf',
      'editorCursor.foreground': '#b48aea',
      'editor.selectionBackground': '#3b2767',
      'editor.inactiveSelectionBackground': '#2b1e47',
      'editor.lineHighlightBackground': '#111114',
      'editor.lineHighlightBorder': '#00000000',
      'editorIndentGuide.background1': '#18181c',
      'editorIndentGuide.activeBackground1': '#2a2a32',
      'editorWhitespace.foreground': '#18181c',
      'editorBracketHighlight.foreground1': '#ececef',
      'editorBracketHighlight.foreground2': '#72b4e8',
      'editorBracketHighlight.foreground3': '#b48aea',
      'editorBracketHighlight.foreground4': '#7dd8b0',
      'editorBracketMatch.background': '#241544',
      'editorBracketMatch.border': '#48367a',
      'editor.findMatchBackground': '#48367a',
      'editor.findMatchHighlightBackground': '#2b1e47',
      'editor.wordHighlightBackground': '#2b1e47',
      'editor.wordHighlightStrongBackground': '#36265e',
      'editorHoverWidget.background': '#111114',
      'editorHoverWidget.border': '#36265e',
      'editorWidget.background': '#111114',
      'editorWidget.border': '#36265e',
      'editorSuggestWidget.background': '#111114',
      'editorSuggestWidget.border': '#36265e',
      'editorSuggestWidget.selectedBackground': '#241544',
      'editorSuggestWidget.highlightForeground': '#b48aea',
      'editorGutter.background': '#09090b',
      'scrollbarSlider.background': '#3a3a4480',
      'scrollbarSlider.hoverBackground': '#56565f90',
      'scrollbarSlider.activeBackground': '#8b8b96a0',
      'minimap.background': '#09090b',
      'editorStickyScroll.background': '#111114',
      'editorStickyScrollHover.background': '#18181c',
      'editorOverviewRuler.border': '#00000000',
      'editorOverviewRuler.bracketMatchForeground': '#b48aea',
      'editorInfo.foreground': '#b48aea',
      'editorWarning.foreground': '#f6c177',
      'editorError.foreground': '#e87272',
    },
    rules: [
      { token: 'comment', foreground: '7A6E94', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'E87272' },
      { token: 'keyword.control', foreground: 'E87272' },
      { token: 'storage', foreground: 'E87272' },
      { token: 'storage.type', foreground: 'C8A0E8' },
      { token: 'string', foreground: '7DD8B0' },
      { token: 'string.escape', foreground: 'F6D3A4' },
      { token: 'number', foreground: '72B4E8' },
      { token: 'constant.numeric', foreground: '72B4E8' },
      { token: 'constant.language', foreground: 'A88DE8' },
      { token: 'regexp', foreground: 'E87272' },
      { token: 'operator', foreground: 'ECECEF' },
      { token: 'delimiter', foreground: '8B8B96' },
      { token: 'delimiter.bracket', foreground: 'ECECEF' },
      { token: 'entity.name.function', foreground: 'C8A0E8' },
      { token: 'support.function', foreground: 'C8A0E8' },
      { token: 'variable.parameter', foreground: 'D4CCDF' },
      { token: 'entity.name.type', foreground: 'C4C4CC' },
      { token: 'support.type', foreground: 'C4C4CC' },
      { token: 'type.identifier', foreground: 'C4C4CC' },
      { token: 'namespace', foreground: 'A88DE8' },
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
        lineHeight: 23,
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
        padding: { top: 20, bottom: 24 },
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
