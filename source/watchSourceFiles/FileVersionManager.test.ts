import { describe, given, it } from '@typed/test'
import { makeAbsolute } from '../common/makeAbsolute'
import { createFileVersionManager } from './FileVersionManager'

export const test = describe(`FileVersionManager`, [
  describe(`addFile`, [
    given(`a file path`, [
      it(`adds file to queue`, ({ ok, notOk }) => {
        const fileName = 'foo.ts'
        const absFileName = makeAbsolute(__dirname, fileName)
        const fileVersionManager = createFileVersionManager({
          fileVersions: {},
          directory: __dirname,
        })

        notOk(fileVersionManager.queue.hasOwnProperty(absFileName))

        fileVersionManager.addFile(fileName)

        ok(fileVersionManager.queue.hasOwnProperty(absFileName))
      }),
    ]),
  ]),

  describe(`updateFile`, [
    given(`a file path`, [
      it(`updates file to queue`, ({ equal }) => {
        const fileName = 'foo.ts'
        const absFileName = makeAbsolute(__dirname, fileName)
        const fileVersionManager = createFileVersionManager({
          fileVersions: {},
          directory: __dirname,
        })

        fileVersionManager.addFile(fileName)
        equal({ version: 1, type: 'ADD' }, fileVersionManager.queue[absFileName])
        fileVersionManager.updateFile(fileName)
        equal({ version: 2, type: 'ADD' }, fileVersionManager.queue[absFileName])
      }),
    ]),

    given(`a file path in fileVersions`, [
      it(`updates file to queue`, ({ equal }) => {
        const fileName = 'foo.ts'
        const absFileName = makeAbsolute(__dirname, fileName)
        const fileVersionManager = createFileVersionManager({
          fileVersions: { [absFileName]: { version: 3 } },
          directory: __dirname,
        })

        fileVersionManager.updateFile(fileName)
        equal({ version: 4, type: 'UPDATE' }, fileVersionManager.queue[absFileName])
      }),
    ]),
  ]),

  describe(`unlinkFile`, [
    given(`a file path`, [
      it(`adds unlink of file to queue`, ({ ok, notOk, equal }) => {
        const fileName = 'foo.ts'
        const absFileName = makeAbsolute(__dirname, fileName)
        const fileVersionManager = createFileVersionManager({
          fileVersions: {},
          directory: __dirname,
        })

        notOk(fileVersionManager.queue.hasOwnProperty(absFileName))
        fileVersionManager.addFile(fileName)
        ok(fileVersionManager.queue.hasOwnProperty(absFileName))
        fileVersionManager.unlinkFile(fileName)

        equal({ type: 'UNLINK', version: 0 }, fileVersionManager.queue[absFileName])
      }),
    ]),
  ]),

  describe(`applyChanges`, [
    it(`applys queue changes to fileVersions`, ({ equal }) => {
      const fileName = 'foo.ts'
      const absFileName = makeAbsolute(__dirname, fileName)
      const fileVersions = {}
      const fileVersionManager = createFileVersionManager({
        fileVersions,
        directory: __dirname,
      })
      fileVersionManager.addFile(fileName)
      fileVersionManager.updateFile(fileName)

      equal({}, fileVersions)
      equal([absFileName], fileVersionManager.applyChanges())
      equal({ [absFileName]: { version: 2 } }, fileVersions)
    }),
  ]),
])
