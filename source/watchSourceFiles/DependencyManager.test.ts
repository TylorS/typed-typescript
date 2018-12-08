import { describe, given, it } from '@typed/test'
import { relative } from 'path'
import { Program } from 'typescript'
import { createLanguageService } from '../createLanguageService'
import { findTsConfig } from '../findTsConfig'
import { createDependencyManager } from './DependencyManager'
import { createFileVersionManager } from './FileVersionManager'

const EXPECTED_DEPENDENCIES_OF_FILE_VERIONS_MANAGER: string[] = [
  'typescript',
  'path',
  '/Users/tylors/code/tylors/typed-typescript/source/common/makeAbsolute.ts',
  '/Users/tylors/code/tylors/typed-typescript/source/watchSourceFiles/FileVersionManager.ts',
]

export const test = describe(`DependencyManager`, [
  describe(`getDependenciesOf / addFile`, [
    given(`a file thats not been added`, [
      it(`return an empty array`, ({ equal }) => {
        const tsConfig = findTsConfig({ directory: __dirname })
        const { languageService, fileVersions } = createLanguageService({ tsConfig })
        const program = languageService.getProgram() as Program
        const dependencyManager = createDependencyManager({
          directory: __dirname,
          compilerOptions: program.getCompilerOptions(),
          fileVersions,
        })

        equal([], dependencyManager.getDependenciesOf('foo.ts'))
      }),
    ]),

    given(`a file thats been added`, [
      it(`return an array of all dependencies`, ({ equal }) => {
        const tsConfig = findTsConfig({ directory: __dirname })
        const { languageService, fileVersions } = createLanguageService({ tsConfig })
        const program = languageService.getProgram() as Program
        const fileVersionManager = createFileVersionManager({ directory: __dirname, fileVersions })
        const dependencyManager = createDependencyManager({
          directory: __dirname,
          compilerOptions: program.getCompilerOptions(),
          fileVersions,
        })
        const fileName = 'FileVersionManager.ts'

        fileVersionManager.addFile(fileName)
        dependencyManager.addFile(fileName)

        // TODO: make this resistant to folder structure changes requiring changes
        equal(
          EXPECTED_DEPENDENCIES_OF_FILE_VERIONS_MANAGER,
          dependencyManager.getDependenciesOf(fileName).map(x => x.path),
        )
      }),
    ]),
  ]),
  describe(`unlinkFile`, [
    given(`a file`, [
      it(`removes a file from management`, ({ equal }) => {
        const tsConfig = findTsConfig({ directory: __dirname })
        const { languageService, fileVersions } = createLanguageService({ tsConfig })
        const program = languageService.getProgram() as Program
        const fileVersionManager = createFileVersionManager({ directory: __dirname, fileVersions })
        const dependencyManager = createDependencyManager({
          directory: __dirname,
          compilerOptions: program.getCompilerOptions(),
          fileVersions,
        })
        const fileName = 'FileVersionManager.ts'

        fileVersionManager.addFile(fileName)
        dependencyManager.addFile(fileName)

        equal(
          EXPECTED_DEPENDENCIES_OF_FILE_VERIONS_MANAGER,
          dependencyManager.getDependenciesOf(fileName).map(x => x.path),
        )

        dependencyManager.unlinkFile(fileName)

        equal(
          [],
          dependencyManager
            .getDependenciesOf(fileName)
            .filter(x => x.type === 'local')
            .map(x => x.path)
            .map(x => relative(__dirname, x)),
        )
      }),
    ]),
  ]),
  describe(`isDependentOf`, [
    given(`a dependent file and the file it depends`, [
      it(`returns true`, ({ ok }) => {
        const tsConfig = findTsConfig({ directory: __dirname })
        const { languageService, fileVersions } = createLanguageService({ tsConfig })
        const program = languageService.getProgram() as Program
        const fileVersionManager = createFileVersionManager({ directory: __dirname, fileVersions })
        const dependencyManager = createDependencyManager({
          directory: __dirname,
          compilerOptions: program.getCompilerOptions(),
          fileVersions,
        })
        const fileName = 'DependencyManager.ts'

        fileVersionManager.addFile(fileName)
        dependencyManager.addFile(fileName)

        ok(
          dependencyManager.isDependentOf(
            EXPECTED_DEPENDENCIES_OF_FILE_VERIONS_MANAGER[2],
            fileName,
          ),
        )
      }),
    ]),

    given(`a random file and the file it does not depend on`, [
      it(`returns false`, ({ notOk }) => {
        const tsConfig = findTsConfig({ directory: __dirname })
        const { languageService, fileVersions } = createLanguageService({ tsConfig })
        const program = languageService.getProgram() as Program
        const fileVersionManager = createFileVersionManager({ directory: __dirname, fileVersions })
        const dependencyManager = createDependencyManager({
          directory: __dirname,
          compilerOptions: program.getCompilerOptions(),
          fileVersions,
        })
        const fileName = 'DependencyManager.ts'

        fileVersionManager.addFile(fileName)
        dependencyManager.addFile(fileName)

        notOk(dependencyManager.isDependentOf('./watchSourceFiles', fileName))
      }),
    ]),
  ]),
])
