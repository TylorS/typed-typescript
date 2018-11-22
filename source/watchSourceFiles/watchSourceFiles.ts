import { chain, uniq } from '@typed/list'
import { isMatch } from 'micromatch'
import { dirname } from 'path'
import sane from 'sane'
import { LanguageService, Program, SourceFile } from 'typescript'
import { makeAbsolute } from '../common/makeAbsolute'
import { createLanguageService } from '../createLanguageService'
import { TsConfig } from '../types'
import { createDependencyManager } from './DependencyManager'
import { createFileVersionManager } from './FileVersionManager'

const DEFAULT_DEBOUNCE_TIME = 1000

export type WatchSourceFilesOptions = {
  tsConfig: TsConfig
  onSourceFiles: (event: SourceFilesEvent) => Promise<void>
  fileGlobs?: string[]
  debounce?: number
}

export type SourceFilesEvent = {
  sourceFiles: SourceFile[]
  program: Program
  languageService: LanguageService
}

export type SourceFileWatcher = {
  dispose: () => void
}

export function watchSourceFiles(options: WatchSourceFilesOptions): SourceFileWatcher {
  const { debounce = DEFAULT_DEBOUNCE_TIME, tsConfig, onSourceFiles } = options
  const { languageService, fileGlobs, fileVersions } = createLanguageService({
    tsConfig,
    fileGlobs: options.fileGlobs,
  })
  const program = languageService.getProgram() as Program
  const compilerOptions = program.getCompilerOptions()
  const directory = dirname(tsConfig.configPath)
  const fileVersionManager = createFileVersionManager({ directory, fileVersions })
  const dependencyManager = createDependencyManager({ directory, compilerOptions })
  const globs = fileGlobs.map(x =>
    x.startsWith('!') ? '!' + makeAbsolute(directory, x.slice(1)) : makeAbsolute(directory, x),
  )
  const matchesFilePatterns = (file: string) =>
    globs.some(x => isMatch(makeAbsolute(directory, file), x))
  const getMatchingFiles = (filePath: string) =>
    matchesFilePatterns(filePath)
      ? [filePath]
      : dependencyManager.getDependentsOf(filePath).filter(matchesFilePatterns)

  // Used to defer updates until later
  let currentlyUpdatingSourceFiles = false
  let readyToBeUpdated = false
  let updateSourceFilesTimeout: any

  async function performUpdate(files: string[]) {
    const program = languageService.getProgram() as Program
    const sourceFilePaths = uniq(chain(getMatchingFiles, files))
    const sourceFiles = sourceFilePaths
      .map(x => program.getSourceFile(x))
      .filter(Boolean) as SourceFile[]

    // If there are relevant SourceFiles perform side-effects.
    if (sourceFiles.length > 0) {
      await onSourceFiles({ sourceFiles, program, languageService })
    }
  }

  async function updateSourceFiles() {
    // If currently updating mark ready to be re-run
    if (currentlyUpdatingSourceFiles) {
      return (readyToBeUpdated = true)
    }

    // Only one instance of this should be running at a time
    currentlyUpdatingSourceFiles = true

    // filesThatHaveChanged - Needs to come before .getProgram() to ensure the
    // program is created with any new files available as SourceFile
    const filesThatHaveChanged: string[] = fileVersionManager.applyChanges()

    await performUpdate(filesThatHaveChanged)

    currentlyUpdatingSourceFiles = false

    // If new updates are ready, run them
    if (readyToBeUpdated) {
      readyToBeUpdated = false

      scheduleNextEvent()
    }
  }

  function scheduleNextEvent() {
    clearTimeout(updateSourceFilesTimeout)
    updateSourceFilesTimeout = setTimeout(updateSourceFiles, debounce)
  }

  const watcher = sane(directory, { glob: fileGlobs })

  watcher.on('add', path => {
    fileVersionManager.addFile(path)
    dependencyManager.addFile(path)
    scheduleNextEvent()
  })
  watcher.on('change', path => {
    fileVersionManager.updateFile(path)
    dependencyManager.updateFile(path)
    scheduleNextEvent()
  })
  watcher.on('delete', path => {
    fileVersionManager.unlinkFile(path)
    dependencyManager.unlinkFile(path)
    scheduleNextEvent()
  })

  const initialFiles = chain(getMatchingFiles, Object.keys(fileVersions))

  performUpdate(initialFiles).then(() => {
    console.log('here')
    console.time('add Dependencies')
    initialFiles.forEach(x => (console.log(x), dependencyManager.addFile(x)))
    console.timeEnd('add Dependencies')
  })

  const dispose = () => {
    clearTimeout(updateSourceFilesTimeout)
    watcher.close()
  }

  return {
    dispose,
  }
}
