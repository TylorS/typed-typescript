import { CompilerOptions, Node } from 'typescript'

export interface TsConfig {
  compilerOptions: CompilerOptions
  configPath: string

  extends?: string | string[]
  files?: string[]
  include?: string[]
  exclude?: string[]
}

export interface NodePosition {
  position: [number, number]
  startLine: number
  endLine: number
  numberOfLines: number
}

export interface NodeTree {
  node: Node
  children: NodeTree[]
}

export interface DependencyTree extends Dependency {
  dependencies: DependencyTree[]
}

export interface Dependency {
  readonly type: DependencyType
  readonly path: string
}

export type DependencyType = 'local' | 'external'

export interface ExportMetadata {
  exportNames: string[]
  node: Node
}

export const enum LogLevel {
  NONE,
  INFO,
  DEBUG,
}

export interface Logger {
  readonly info: (...msg: string[]) => Promise<void>
  readonly error: (...msg: string[]) => Promise<void>
  readonly clear: (...msg: string[]) => Promise<void>
  readonly debug: (...msg: string[]) => Promise<void>
  readonly timeStart: (msg: string) => Promise<void>
  readonly timeEnd: (msg: string) => Promise<void>
}
