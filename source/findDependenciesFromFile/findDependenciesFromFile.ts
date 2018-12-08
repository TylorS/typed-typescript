import { dirname } from 'path'
import { sync } from 'resolve'
import { CompilerOptions, preProcessFile, sys } from 'typescript'
import { getFileExtensions } from '../getFileExtensions'
import { DependencyCache } from './DependencyCache'

type ResolveOptions = {
  basedir: string
  extensions: string[]
}

const createResolveOptionsFactory = (extensions: string[]) => (
  fileName: string,
): ResolveOptions => ({
  basedir: dirname(fileName),
  extensions,
})

export function findDependenciesFromFile(
  fileName: string,
  dependencyCache: DependencyCache,
  compilerOptions: CompilerOptions,
): void {
  const createResolveOptions = createResolveOptionsFactory(
    getFileExtensions({ ...compilerOptions, allowJs: true }),
  )
  const fileResolveOptions = createResolveOptions(fileName)
  const fileDependencies = findDependencies(fileName)
  const filesToProcess = fileDependencies.map(filePath => ({
    path: findPathToUse(filePath, fileResolveOptions),
    parent: fileName,
  }))

  while (filesToProcess.length > 0) {
    const { path, parent } = filesToProcess.shift() as { path: string; parent: string }

    if (parent !== fileName && dependencyCache.has(path)) {
      continue
    }

    const pathResolveOptions = createResolveOptions(path)
    const fileDependencies = findDependencies(path)

    dependencyCache.addDependencyOf(parent, path)

    if (fileDependencies.length > 0) {
      filesToProcess.push(
        ...fileDependencies.map(filePath => ({
          path: findPathToUse(filePath, pathResolveOptions),
          parent: path,
        })),
      )
    }
  }
}

function findPathToUse(path: string, resolveOptions: ResolveOptions) {
  const fullPath = sync(path, resolveOptions)

  return fullPath.includes('node_modules') ? path : fullPath
}

function findDependencies(filePath: string): string[] {
  const { importedFiles, referencedFiles } = preProcessFile(
    sys.readFile(filePath) as string,
    true,
    true,
  )
  const fileDependencies = importedFiles.concat(referencedFiles).map(x => x.fileName)

  return fileDependencies
}
