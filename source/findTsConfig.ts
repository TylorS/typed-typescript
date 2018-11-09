import {
  convertCompilerOptionsFromJson,
  findConfigFile,
  parseConfigFileTextToJson,
  sys,
} from 'typescript'
import { diagnosticsToString } from './diagnosticsToString'
import { TsConfig } from './types'

const TS_CONFIG = 'tsconfig.json'

export function findTsConfig(directory: string): TsConfig {
  const configPath = findConfigFile(directory, sys.fileExists, TS_CONFIG)

  if (!configPath) {
    throw new Error(`Unable to find ${TS_CONFIG} from ${directory}`)
  }

  const configContents = sys.readFile(configPath) as string
  const { config } = parseConfigFileTextToJson(configPath, configContents)
  const { compilerOptions: unparsedCompilerOptions } = config
  const { options: compilerOptions, errors } = convertCompilerOptionsFromJson(
    unparsedCompilerOptions,
    directory,
    TS_CONFIG,
  )

  if (errors && errors.length > 0) {
    throw new Error(diagnosticsToString(errors, directory))
  }

  return { ...config, compilerOptions, configPath }
}
