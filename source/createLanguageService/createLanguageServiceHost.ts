import {
  CompilerOptions,
  getDefaultLibFilePath,
  LanguageServiceHost,
  MapLike,
  ScriptSnapshot,
  sys,
} from 'typescript'
import { findFilePaths } from '../common/findFilePaths'
import { makeAbsolute } from '../common/makeAbsolute'

export interface LanguageServiceHostOptions {
  directory: string
  fileGlobs: string[]
  fileVersions: MapLike<{ version: number }>
  compilerOptions: CompilerOptions
}

export function createLanguageServiceHost(options: LanguageServiceHostOptions) {
  const { directory, fileGlobs, fileVersions, compilerOptions } = options

  const languageServiceHost: LanguageServiceHost = {
    getScriptFileNames: () =>
      findFilePaths(directory, fileGlobs).map(x => makeAbsolute(directory, x)),
    getScriptVersion: fileName => {
      const key = makeAbsolute(directory, fileName)

      return fileVersions[key] && fileVersions[key].version.toString()
    },
    getScriptSnapshot: fileName => {
      const pathname = makeAbsolute(directory, fileName)
      const contents = sys.readFile(pathname)
      const snapshot = contents ? ScriptSnapshot.fromString(contents) : undefined

      return snapshot
    },
    getCurrentDirectory: () => directory,
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: getDefaultLibFilePath,
    fileExists: sys.fileExists,
    readFile: sys.readFile,
    readDirectory: sys.readDirectory,
  }

  return languageServiceHost
}
