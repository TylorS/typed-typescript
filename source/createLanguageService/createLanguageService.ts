import { dirname } from 'path'
import { createLanguageService as createLs, LanguageService, MapLike } from 'typescript'
import { findFilePaths } from '../common/findFilePaths'
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
    fileVersions,
    compilerOptions,
  })

  findFilePaths(directory, fileGlobs).forEach(filePath => {
    fileVersions[filePath] = { version: 1 }
  })

  return {
    languageService: createLs(languageServiceHost, undefined, syntaxOnly),
    fileVersions,
    fileGlobs,
  }
}
