import { Logger, LogLevel } from '../types'

export function nodeLogger(logLevel: LogLevel): Logger {
  const timers: Record<string, any> = {}

  return {
    info: async (...args: string[]) => {
      if (logLevel >= LogLevel.INFO) {
        console.log(...args)
      }
    },
    warn: async (...args: string[]) => {
      if (logLevel >= LogLevel.WARN) {
        console.warn(...args)
      }
    },
    error: async (...args: string[]) => {
      if (logLevel > LogLevel.NONE) {
        console.error(...args)
      }
    },
    clear: async () => {
      if (logLevel < LogLevel.DEBUG && logLevel > LogLevel.NONE) {
        console.clear()
      }
    },
    debug: async (...args: string[]) => {
      if (logLevel >= LogLevel.DEBUG) {
        console.info(...args)
      }
    },
    timeStart: async (msg: string) => {
      if (logLevel >= LogLevel.DEBUG) {
        timers[msg] = createTimer(msg)
      }
    },
    timeEnd: async (msg: string) => {
      if (logLevel >= LogLevel.DEBUG && timers[msg]) {
        timers[msg]()
        delete timers[msg]
      }
    },
  }
}

const createTimer = (msg: string) => {
  console.time(msg)

  return () => console.timeEnd(msg)
}
