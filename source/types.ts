import { CompilerOptions, Node } from 'typescript'

export interface TsConfig {
  compilerOptions: CompilerOptions
  configPath: string

  extends?: string | string[]
  files?: string[]
  include?: string[]
  exclude?: string[]
}

export interface NodeTree {
  node: Node
  position: [number, number]
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
