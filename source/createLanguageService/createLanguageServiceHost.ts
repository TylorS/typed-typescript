import {
  CompilerOptions,
  getDefaultLibFilePath,
  LanguageServiceHost,
  MapLike,
  ScriptSnapshot,
  sys,
} from 'typescript'
import { findFilePaths } from './findFilePaths'
import { makeAbsolute } from './makeAbsolute'

export interface LanguageServiceHostOptions {
  cwd: string
  fileGlobs: string[]
  fileVersions: MapLike<{ version: number }>
  compilerOptions: CompilerOptions
}

export function createLanguageServiceHost(options: LanguageServiceHostOptions) {
  const { cwd, fileGlobs, fileVersions, compilerOptions } = options

  const languageServiceHost: LanguageServiceHost = {
    getScriptFileNames: () => findFilePaths(cwd, fileGlobs).map(x => makeAbsolute(cwd, x)),
    getScriptVersion: fileName => {
      const key = makeAbsolute(cwd, fileName)

      return fileVersions[key] && fileVersions[key].version.toString()
    },
    getScriptSnapshot: fileName => {
      const pathname = makeAbsolute(cwd, fileName)
      const contents = sys.readFile(pathname)

      return contents ? ScriptSnapshot.fromString(contents) : undefined
    },
    getCurrentDirectory: () => cwd,
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: getDefaultLibFilePath,
    fileExists: sys.fileExists,
    readFile: sys.readFile,
    readDirectory: sys.readDirectory,
  }

  return languageServiceHost
}
