import { createLanguageService as createLs, LanguageService, MapLike } from 'typescript'
import { TsConfig } from '../types'
import { createLanguageServiceHost } from './createLanguageServiceHost'

export interface LanguageServiceOptions {
  tsConfig: TsConfig
  fileVersions?: MapLike<{ version: number }>
  cwd?: string
  fileGlobs?: string[]
  syntaxOnly?: boolean
}

const DEFAULT_EXCLUDE = ['node_modules/**/*']

export function createLanguageService(options: LanguageServiceOptions): LanguageService {
  const { cwd = process.cwd(), tsConfig, syntaxOnly, fileVersions = {} } = options
  const { files = [], include = [], exclude = DEFAULT_EXCLUDE, compilerOptions } = tsConfig
  const fileGlobs = options.fileGlobs
    ? options.fileGlobs
    : [...files, ...include, ...exclude.map(x => `!${x}`)]
  const languageServiceHost = createLanguageServiceHost({
    cwd,
    fileGlobs,
    fileVersions,
    compilerOptions,
  })

  const filePaths = languageServiceHost.getScriptFileNames()

  filePaths.forEach(filePath => {
    fileVersions[filePath] = { version: 0 }
  })

  const ls = createLs(languageServiceHost, undefined, syntaxOnly)

  return ls
}
