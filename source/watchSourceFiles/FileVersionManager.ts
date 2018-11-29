import { MapLike } from 'typescript'
import { makeAbsolute } from '../common/makeAbsolute'

export type FileVersions = MapLike<{ version: number }>
export type VersionUpdateType = 'ADD' | 'UPDATE' | 'UNLINK'
export type VersionUpdate = { type: VersionUpdateType; version: number }
export type VersionQueue = Record<string, VersionUpdate>

const UNLINK_QUEUE_UPDATE: VersionUpdate = { type: 'UNLINK', version: 0 }
const ADD_QUEUE_UPDATE: VersionUpdate = { type: 'ADD', version: 1 }

// A FileVersionManager is capable of Keeping track of file version
// changes for a LanguageService. It works with a queue system
// perfect for batching many changes or waiting for other
// resources to be ready for the changes.
export interface FileVersionManager {
  readonly queue: VersionQueue
  readonly addFile: (filePath: string) => void
  readonly updateFile: (filePath: string) => void
  readonly unlinkFile: (filePath: string) => void
  readonly applyChanges: () => string[]
  readonly versionOf: (filePath: string) => number
}

export type CreateFileVersionManagerOptions = {
  fileVersions: FileVersions
  directory: string
}

export function createFileVersionManager({
  fileVersions,
  directory,
}: CreateFileVersionManagerOptions): FileVersionManager {
  let queue: VersionQueue = {}

  const addFile = (filePath: string) => addFileToQueue(makeAbsolute(directory, filePath), queue)
  const updateFile = (filePath: string) =>
    updateFileInQueue(makeAbsolute(directory, filePath), queue, fileVersions)
  const unlinkFile = (filePath: string) =>
    unlinkFileInQueue(makeAbsolute(directory, filePath), queue)

  function applyChanges() {
    const currentQueue = queue
    const files: string[] = []
    queue = {}

    for (const filePath of Object.keys(currentQueue)) {
      const { type, version } = currentQueue[filePath]

      if (type === 'UNLINK') {
        delete fileVersions[filePath]
        continue
      }

      fileVersions[filePath] = { version }
      files.push(filePath)
    }

    return files
  }

  function versionOf(file: string): number {
    const { version } = fileVersions[makeAbsolute(directory, file)] || { version: -1 }

    return version
  }

  return {
    get queue() {
      return queue
    },
    addFile,
    updateFile,
    unlinkFile,
    applyChanges,
    versionOf,
  }
}

function addFileToQueue(filePath: string, queue: VersionQueue) {
  queue[filePath] = { ...ADD_QUEUE_UPDATE }
}

function updateFileInQueue(filePath: string, queue: VersionQueue, fileVersions: FileVersions) {
  const current = queue[filePath]

  if (!current) {
    if (fileVersions[filePath]) {
      return (queue[filePath] = { type: 'UPDATE', version: fileVersions[filePath].version + 1 })
    }

    return addFileToQueue(filePath, queue)
  }

  if (current.type !== 'ADD') {
    current.type = 'UPDATE'
  }

  current.version++
}

function unlinkFileInQueue(filePath: string, queue: VersionQueue) {
  queue[filePath] = { ...UNLINK_QUEUE_UPDATE }
}
