import { uniq } from '@typed/list'
import * as chokidar from 'chokidar'
import { dirname } from 'path'
import { LanguageService, Program, SourceFile } from 'typescript'
import { findFilePaths } from '../common/findFilePaths'
import { flattenDependencies } from '../common/flattenDependencies'
import { makeAbsolute } from '../common/makeAbsolute'
import { createLanguageService } from '../createLanguageService'
import { findDependenciesFromSourceFile } from '../findDependenciesFromSourceFile'
import { TsConfig } from '../types'

export type WatchSourceFilesOptions = {
  tsConfig: TsConfig
  onSourceFiles: (event: SourceFilesEvent) => void
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

// TODO : refactor and test
// POC: Complete
export function watchSourceFiles(options: WatchSourceFilesOptions): SourceFileWatcher {
  const { debounce = 500, tsConfig, onSourceFiles } = options
  const { languageService, fileGlobs, fileVersions } = createLanguageService({
    tsConfig,
    fileGlobs: options.fileGlobs,
  })
  const directory = dirname(tsConfig.configPath)
  let queue: Record<string, Array<'ADD' | 'UPDATE' | 'UNLINK'>> = {}

  const filesWeAreWatching = findFilePaths(directory, fileGlobs)
  const dependencyMap: Record<string, string[]> = {}

  function updateDependencyMap(file: string, program: Program) {
    const sourceFile = program.getSourceFile(file)

    if (sourceFile) {
      const dependencies = flattenDependencies(
        findDependenciesFromSourceFile(sourceFile, program),
      ).filter(x => x.type === 'local')

      for (const { path } of dependencies) {
        if (path !== file) {
          if (!dependencyMap[path]) {
            dependencyMap[path] = [file]
          } else {
            dependencyMap[path].push(file)
          }
        }
      }
    }
  }

  const program = languageService.getProgram() as Program
  for (const file of filesWeAreWatching) {
    updateDependencyMap(file, program)
  }

  let drainingQueue = false
  let id: any

  function addEvent(filePath: string, event: 'ADD' | 'UPDATE' | 'UNLINK') {
    const events = queue[filePath] || []

    events.push(event)

    queue[filePath] = events
  }

  function drainQueue() {
    if (drainingQueue) {
      return scheduleNextEvent()
    }

    const updates = queue

    drainingQueue = true
    queue = {}

    const filePaths = Object.keys(updates)
    const program = languageService.getProgram() as Program
    const sourceFilesToGet: string[] = []

    for (const filePath of filePaths) {
      const { type, amount } = diffUpdates(updates[filePath])

      if (type === 'UNLINK') {
        delete fileVersions[filePath]

        if (dependencyMap[filePath]) {
          delete dependencyMap[filePath]
        }

        continue
      }

      if (type === 'ADD') {
        fileVersions[filePath] = { version: amount }
      }

      if (type === 'UPDATE') {
        fileVersions[filePath].version += amount
      }

      updateDependencyMap(filePath, program)

      if (filesWeAreWatching.includes(filePath)) {
        sourceFilesToGet.push(filePath)
      } else {
        ;(dependencyMap[filePath] || []).forEach(x => sourceFilesToGet.push(x))
      }
    }

    const sourceFiles = uniq(sourceFilesToGet)
      .filter(x => filesWeAreWatching.includes(x))
      .map(filePath => program.getSourceFile(filePath))
      .filter(Boolean) as SourceFile[]

    onSourceFiles({ sourceFiles, program, languageService })

    drainingQueue = false
  }
  function addFile(filePath: string) {
    addEvent(filePath, 'ADD')
    scheduleNextEvent()
  }
  function updateFile(filePath: string) {
    addEvent(filePath, 'UPDATE')
    scheduleNextEvent()
  }
  function unlinkFile(filePath: string) {
    addEvent(filePath, 'UNLINK')
    scheduleNextEvent()
  }
  function scheduleNextEvent() {
    clearTimeout(id)
    id = setTimeout(drainQueue, debounce)
  }

  const watcher = chokidar.watch([...program.getSourceFiles().map(x => x.fileName), ...fileGlobs], {
    cwd: directory,
  })

  watcher.on('add', path => addFile(makeAbsolute(directory, path)))
  watcher.on('change', path => updateFile(makeAbsolute(directory, path)))
  watcher.on('unlink', path => unlinkFile(makeAbsolute(directory, path)))

  const dispose = () => {
    clearTimeout(id)
    watcher.close()
  }

  return {
    dispose,
  }
}

export type DiffUpdate = {
  type: 'ADD' | 'UPDATE' | 'UNLINK'
  amount: number
}

function diffUpdates(updates: Array<'ADD' | 'UPDATE' | 'UNLINK'>): DiffUpdate {
  let amount = 0
  let type: 'ADD' | 'UPDATE' | 'UNLINK' = 'UNLINK'

  for (const update of updates) {
    if (update === 'ADD') {
      type = 'ADD'
      amount = 1
    }

    if (update === 'UPDATE') {
      if (type !== 'ADD') {
        type = 'UPDATE'
      }

      amount++
    }

    if (update === 'UNLINK') {
      type = 'UNLINK'
      amount = 0
    }
  }

  return {
    type,
    amount,
  }
}
