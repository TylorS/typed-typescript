import { chain, uniq } from '@typed/list'
import { isMatch } from 'micromatch'
import nsfw from 'nsfw'
import { basename, dirname, join } from 'path'
import { LanguageService, Program, SourceFile } from 'typescript'
import { makeAbsolute } from '../common/makeAbsolute'
import { createLanguageService } from '../createLanguageService'
import { Logger, TsConfig } from '../types'
import { createDependencyManager } from './DependencyManager'
import { createFileVersionManager } from './FileVersionManager'

const DEFAULT_DEBOUNCE_TIME = 1000

export type WatchSourceFilesOptions = {
  tsConfig: TsConfig
  logger: Logger
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
  start: () => void
  dispose: () => void
}

export async function watchSourceFiles(
  options: WatchSourceFilesOptions,
): Promise<SourceFileWatcher> {
  const { debounce = DEFAULT_DEBOUNCE_TIME, tsConfig, onSourceFiles, logger } = options
  const { languageService, fileGlobs, fileVersions } = createLanguageService({
    tsConfig,
    fileGlobs: options.fileGlobs,
  })
  let program = languageService.getProgram() as Program
  const compilerOptions = program.getCompilerOptions()
  const directory = dirname(tsConfig.configPath)
  const fileVersionManager = createFileVersionManager({ directory, fileVersions })
  const dependencyManager = createDependencyManager({
    directory,
    compilerOptions,
    fileVersions,
  })
  const globs = fileGlobs.map(x =>
    x.startsWith('!') ? '!' + makeAbsolute(directory, x.slice(1)) : makeAbsolute(directory, x),
  )
  const matchesFilePatterns = (file: string) =>
    globs.some(x => isMatch(makeAbsolute(directory, file), x))

  const getDependentFiles = (filePath: string) => {
    const dependents = dependencyManager
      .getDependentsOf(filePath)
      .map(x => x.path)
      .concat(filePath)

    return dependents
  }

  // Used to defer updates until later
  let currentlyUpdatingSourceFiles = false
  let readyToBeUpdated = false
  let updateSourceFilesTimeout: any

  async function performUpdate(files: string[]) {
    const filePaths = uniq(chain(getDependentFiles, files))
    program = languageService.getProgram() as Program
    const sourceFiles = filePaths
      .map(x => matchesFilePatterns(x) && program.getSourceFile(x))
      .filter(Boolean) as SourceFile[]

    // If there are relevant SourceFiles perform side-effects.
    if (sourceFiles.length > 0) {
      await onSourceFiles({ sourceFiles, program, languageService })
    }
  }

  async function updateSourceFiles(files: string[] = fileVersionManager.applyChanges()) {
    // If currently updating mark ready to be re-run
    if (currentlyUpdatingSourceFiles) {
      return (readyToBeUpdated = true)
    }

    await logger.info('Performing Update...')
    await logger.timeStart('Performed Update')
    // Only one instance of this should be running at a time
    currentlyUpdatingSourceFiles = true

    await performUpdate(files)

    currentlyUpdatingSourceFiles = false
    await logger.timeEnd('Performed Update')

    // If new updates are ready, run them
    if (readyToBeUpdated) {
      readyToBeUpdated = false

      scheduleNextEvent()
    }
  }

  function handleEvent(event: nsfw.Event) {
    logger.debug('File Event', JSON.stringify(event))
    if (event.action === 3) {
      const oldPath = join(event.directory, event.oldFile)
      const path = join(event.directory, event.newFile)

      fileVersionManager.unlinkFile(oldPath)
      dependencyManager.unlinkFile(oldPath)
      dependencyManager.updateFile(path)
      fileVersionManager.updateFile(path)

      return
    }

    const path = join(event.directory, event.file)

    if (event.action === 0) {
      fileVersionManager.addFile(path)
      return dependencyManager.addFile(path)
    }

    if (event.action === 2) {
      fileVersionManager.updateFile(path)
      return dependencyManager.updateFile(path)
    }

    if (event.action === 1) {
      fileVersionManager.unlinkFile(path)
      return dependencyManager.unlinkFile(path)
    }
  }

  async function scheduleNextEvent() {
    await logger.debug('Scheduling next event')
    clearTimeout(updateSourceFilesTimeout)
    updateSourceFilesTimeout = setTimeout(updateSourceFiles, debounce)
  }

  const watcher = await nsfw(
    directory,
    (events: nsfw.Event[]) => {
      events.forEach(handleEvent)
      scheduleNextEvent()
    },
    {
      debounceMS: debounce,
    },
  )

  const start = async () => {
    await logger.debug('Starting File Watcher...')

    watcher.start()

    fileVersionManager.files().forEach(file =>
      handleEvent({
        action: 0,
        file: basename(makeAbsolute(directory, file)),
        directory: dirname(makeAbsolute(directory, file)),
      }),
    )

    scheduleNextEvent()
  }
  const dispose = () => {
    clearTimeout(updateSourceFilesTimeout)
    watcher.stop()
  }

  return {
    start,
    dispose,
  }
}
