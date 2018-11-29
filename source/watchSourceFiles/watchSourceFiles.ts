import { chain, uniq } from '@typed/list'
import { isMatch } from 'micromatch'
import nsfw from 'nsfw'
import { dirname, join } from 'path'
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

export async function watchSourceFiles(
  options: WatchSourceFilesOptions,
): Promise<SourceFileWatcher> {
  const { debounce = DEFAULT_DEBOUNCE_TIME, tsConfig, onSourceFiles } = options
  const { languageService, fileGlobs, fileVersions } = createLanguageService({
    tsConfig,
    fileGlobs: options.fileGlobs,
  })
  const program = languageService.getProgram() as Program
  const compilerOptions = program.getCompilerOptions()
  const directory = dirname(tsConfig.configPath)
  const fileVersionManager = createFileVersionManager({ directory, fileVersions })
  const dependencyManager = createDependencyManager({
    directory,
    compilerOptions,
    fileVersionManager,
  })
  const globs = fileGlobs.map(x =>
    x.startsWith('!') ? '!' + makeAbsolute(directory, x.slice(1)) : makeAbsolute(directory, x),
  )
  const matchesFilePatterns = (file: string) =>
    globs.some(x => isMatch(makeAbsolute(directory, file), x))
  const getMatchingFiles = (filePath: string) =>
    dependencyManager
      .getDependentsOf(filePath)
      .concat(filePath)
      .filter(matchesFilePatterns)
  const initialFileNames = Object.keys(fileVersions)

  initialFileNames.forEach(dependencyManager.addFile)

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

    await performUpdate(fileVersionManager.applyChanges())

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

  performUpdate(chain(getMatchingFiles, initialFileNames))

  const watcher = await nsfw(
    directory,
    (events: nsfw.Event[]) => {
      for (const event of events) {
        if (event.file !== 'folder') {
          const path = join(event.directory, event.file)

          if (event.action === 0) {
            dependencyManager.addFile(path)
          }

          if (event.action === 2) {
            dependencyManager.updateFile(path)
          }

          if (event.action === 1) {
            dependencyManager.unlinkFile(path)
          }

          if (event.action === 3) {
            const oldPath = join(event.directory, event.oldFile)

            dependencyManager.unlinkFile(oldPath)
            dependencyManager.updateFile(path)
          }
        }
      }

      scheduleNextEvent()
    },
    {
      debounceMS: debounce,
    },
  )

  watcher.start()

  const dispose = () => {
    clearTimeout(updateSourceFilesTimeout)
    watcher.stop()
  }

  return {
    dispose,
  }
}
