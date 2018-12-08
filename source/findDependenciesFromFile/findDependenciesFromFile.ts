import { dirname } from 'path'
import { sync } from 'resolve'
import { CompilerOptions, FileReference, preProcessFile, sys } from 'typescript'
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
  const filesToProcess = fileDependencies.map(dependency => ({
    path: findPathToUse(dependency.fileName, fileResolveOptions),
    parent: fileName,
  }))

  while (filesToProcess.length > 0) {
    const { path, parent } = filesToProcess.shift() as { path: string; parent: string }

    if (dependencyCache.has(path)) {
      continue
    }

    const pathResolveOptions = createResolveOptions(path)
    const fileDependencies = findDependencies(path)

    dependencyCache.addDependencyOf(parent, path)

    if (fileDependencies.length > 0) {
      filesToProcess.push(
        ...fileDependencies.map(dependency => ({
          path: findPathToUse(dependency.fileName, pathResolveOptions),
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

function findDependencies(filePath: string): FileReference[] {
  const { importedFiles, referencedFiles } = preProcessFile(
    sys.readFile(filePath) as string,
    true,
    true,
  )

  return importedFiles.concat(referencedFiles)
}
