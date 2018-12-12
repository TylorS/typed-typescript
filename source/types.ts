import { CompilerOptions } from 'typescript'

export interface TsConfig {
  compilerOptions: CompilerOptions
  configPath: string
  extends: string[]
  files: string[]
  include: string[]
  exclude: string[]
}

export interface NodePosition {
  position: [number, number]
  startLine: number
  endLine: number
  numberOfLines: number
}

export const enum LogLevel {
  NONE,
  WARN,
  INFO,
  DEBUG,
}

export interface Logger {
  readonly info: (...msg: string[]) => Promise<void>
  readonly warn: (...msg: string[]) => Promise<void>
  readonly error: (...msg: string[]) => Promise<void>
  readonly clear: (...msg: string[]) => Promise<void>
  readonly debug: (...msg: string[]) => Promise<void>
  readonly timeStart: (msg: string) => Promise<void>
  readonly timeEnd: (msg: string) => Promise<void>
}
