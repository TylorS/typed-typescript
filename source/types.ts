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

export interface DependencyTree {
  filePath: string
  dependencies: DependencyTree[]
}

export interface ExportMetadata {
  exportNames: string[]
  node: Node
}
