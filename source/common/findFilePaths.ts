import { sync } from 'glob'
import { makeAbsolute } from './makeAbsolute'

export function findFilePaths(directory: string, fileGlobs: string[]): string[] {
  const fileNames: string[] = []

  for (const fileGlob of fileGlobs) {
    fileNames.push(...sync(fileGlob, { cwd: directory }))
  }

  return fileNames.map(x => makeAbsolute(directory, x))
}
