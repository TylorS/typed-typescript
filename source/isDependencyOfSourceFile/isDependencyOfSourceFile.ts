import { curry3 } from '@typed/functions'
import { dirname, extname } from 'path'
import { sync as resolve } from 'resolve'
import { findConfigFile, Program, SourceFile, sys } from 'typescript'
import { makeAbsolute } from '../common/makeAbsolute'
import { findDependenciesFromSourceFile } from '../findDependenciesFromSourceFile'
import { flattenDependencies } from '../flattenDependencies'
import { getFileExtensions } from '../getFileExtensions'

export const isDependencyOfSourceFile: {
  (program: Program, sourceFile: SourceFile, filePath: string): boolean
  (program: Program, sourceFile: SourceFile): (filePath: string) => boolean
  (program: Program): {
    (sourceFile: SourceFile, filePath: string): boolean
    (sourceFile: SourceFile): (filePath: string) => boolean
  }
} = curry3(__isDependencyOfSourceFile)

function __isDependencyOfSourceFile(
  program: Program,
  sourceFile: SourceFile,
  filePath: string,
): boolean {
  const currentDirectory = program.getCurrentDirectory()
  const compilerOptions = program.getCompilerOptions()
  // Use allowJs since external modules will always resolve to .js
  const extensions = getFileExtensions({ ...compilerOptions, allowJs: true })
  const dependencies = flattenDependencies(findDependenciesFromSourceFile(sourceFile, program))

  for (const { type, path } of dependencies) {
    if (type === 'local') {
      if (makeAbsolute(currentDirectory, path) === filePath) {
        return true
      }

      continue
    }

    if (type === 'external') {
      const packageIndex = resolve(path)
      const packageJson = findConfigFile(dirname(packageIndex), sys.fileExists, 'package.json')

      if (!packageJson) {
        continue
      }

      const packageDir = dirname(packageJson)
      const withinPackageDirectory = filePath.indexOf(packageDir) === 0
      const ext = extname(filePath)

      if (withinPackageDirectory && extensions.includes(ext)) {
        return true
      }
    }
  }

  return false
}
