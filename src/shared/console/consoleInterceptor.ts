// TODO(#1006): Remove consoleInterceptor
import { createSignal } from 'solid-js'

export type ConsoleLog = {
  level: 'log' | 'warn' | 'error' | 'info' | 'debug'
  message: string
  timestamp: Date
  args: unknown[]
}

const [consoleLogs, setConsoleLogs] = createSignal<ConsoleLog[]>([])

type OriginalConsole = {
  log: typeof console.log
  warn: typeof console.warn
  error: typeof console.error
  info: typeof console.info
  debug: typeof console.debug
}

let originalConsole: OriginalConsole | null = null

export function startConsoleInterception() {
  if (originalConsole) return

  originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
  }

  const interceptMethod = (level: ConsoleLog['level']) => {
    const original = originalConsole![level]
    return (...args: unknown[]) => {
      const message = args
        .map((arg) =>
          typeof arg === 'object' && arg !== null
            ? JSON.stringify(arg)
            : String(arg),
        )
        .join(' ')

      setConsoleLogs((prev) => [
        ...prev,
        {
          level,
          message,
          timestamp: new Date(),
          args,
        },
      ])

      // Call original console method
      original.apply(console, args)
    }
  }

  console.log = interceptMethod('log')
  console.warn = interceptMethod('warn')
  console.error = interceptMethod('error')
  console.info = interceptMethod('info')
  console.debug = interceptMethod('debug')
}

export function stopConsoleInterception() {
  if (!originalConsole) return

  console.log = originalConsole.log
  console.warn = originalConsole.warn
  console.error = originalConsole.error
  console.info = originalConsole.info
  console.debug = originalConsole.debug

  originalConsole = null
}

export function getConsoleLogs() {
  return consoleLogs()
}

export function clearConsoleLogs() {
  setConsoleLogs([])
}

export function formatConsoleLogsForExport(): string {
  const logs = getConsoleLogs()
  return logs
    .map(
      (log) =>
        `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] ${log.message}`,
    )
    .join('\n')
}

export function copyConsoleLogsToClipboard(): Promise<void> {
  const formattedLogs = formatConsoleLogsForExport()
  return navigator.clipboard.writeText(formattedLogs)
}

export function downloadConsoleLogsAsFile(): void {
  const formattedLogs = formatConsoleLogsForExport()
  const blob = new Blob([formattedLogs], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `console-logs-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

export function shareConsoleLogs(): Promise<void> {
  const formattedLogs = formatConsoleLogsForExport()

  if (!('share' in navigator)) {
    throw new Error('Share API não suportada neste dispositivo')
  }

  return navigator.share({
    title: 'Console Logs',
    text: formattedLogs,
  })
}
