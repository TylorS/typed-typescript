import { dirname } from 'path'
import { createLanguageService as createLs, LanguageService, MapLike } from 'typescript'
import { TsConfig } from '../types'
import { createLanguageServiceHost } from './createLanguageServiceHost'

export interface LanguageServiceOptions {
  tsConfig: TsConfig
  fileGlobs?: string[]
  syntaxOnly?: boolean
}

const DEFAULT_EXCLUDE = ['node_modules/**/*']

export function createLanguageService(
  options: LanguageServiceOptions,
): {
  languageService: LanguageService
  fileVersions: MapLike<{ version: number }>
  fileGlobs: string[]
} {
  const { tsConfig, syntaxOnly } = options
  const { files = [], include = [], exclude = DEFAULT_EXCLUDE, compilerOptions } = tsConfig
  const directory = dirname(tsConfig.configPath)
  const fileGlobs = options.fileGlobs
    ? options.fileGlobs
    : [...files, ...include, ...exclude.map(x => `!${x}`)]
  const fileVersions: MapLike<{ version: number }> = {}
  const languageServiceHost = createLanguageServiceHost({
    directory,
    fileGlobs,
    fileVersions,
    compilerOptions,
  })

  const filePaths = languageServiceHost.getScriptFileNames()

  filePaths.forEach(filePath => {
    fileVersions[filePath] = { version: 0 }
  })

  return {
    languageService: createLs(languageServiceHost, undefined, syntaxOnly),
    fileVersions,
    fileGlobs,
  }
}
