import { describe, given, it } from '@typed/test'
import { join } from 'path'
import { createIdentifier, isFunctionLike } from 'typescript'
import { setupFixtureTestEnvironment } from '../../test-helpers/setupFixtureTestEnvironment'
import { findChildNodes } from '../findChildNodes'
import { isExportedFromSourceFile } from './isExportedFromSourceFile'

const testFixtures = join(__dirname, '../../test-helpers/fixtures')

export const test = describe(`isExportedFromSourceFile`, [
  given(`a Node and a SourceFile`, [
    it(`return true if node is exported by SourceFile`, ({ ok }) => {
      const filePath = join(testFixtures, 'functions.ts')
      const { sourceFile, typeChecker } = setupFixtureTestEnvironment(__dirname, filePath)
      const [{ node }] = findChildNodes(isFunctionLike, [sourceFile])
      const isExported = isExportedFromSourceFile(typeChecker, sourceFile, node)

      ok(isExported)
    }),

    it(`return false if node is exported by SourceFile`, ({ notOk }) => {
      const filePath = join(testFixtures, 'functions.ts')
      const { sourceFile, typeChecker } = setupFixtureTestEnvironment(__dirname, filePath)
      const isExported = isExportedFromSourceFile(typeChecker, sourceFile, createIdentifier('foo'))

      notOk(isExported)
    }),
  ]),
])
