import { configLoader, ExplicitParams } from 'tsconfig-paths/lib/config-loader'
import { createMatchPath } from 'tsconfig-paths/lib/match-path-sync'
import { options } from 'tsconfig-paths/lib/options'

// Taken from https://github.com/dividab/tsconfig-paths/blob/master/src/register.ts
// Just adding the ability to cleanup afterwards

/**
 * Installs a custom module load function that can adhere to paths in tsconfig.
 */
export function registerTsPaths(explicitParams: ExplicitParams): () => void {
  const configLoaderResult = configLoader({
    cwd: options.cwd,
    explicitParams,
  })

  if (configLoaderResult.resultType === 'failed') {
    console.warn(`${configLoaderResult.message}. tsconfig-paths will be skipped`)

    return () => void 0
  }

  const matchPath = createMatchPath(configLoaderResult.absoluteBaseUrl, configLoaderResult.paths)

  // Patch node's module loading
  // tslint:disable-next-line:no-require-imports variable-name
  const Module = require('module')
  const originalResolveFilename = Module._resolveFilename
  const coreModules = getCoreModules(Module.builtinModules)
  // tslint:disable-next-line:no-any
  // tslint:disable-next-line:variable-name
  Module._resolveFilename = function(request: string, _parent: any): string {
    const isCoreModule = coreModules.hasOwnProperty(request)
    if (!isCoreModule) {
      const found = matchPath(request)
      if (found) {
        const modifiedArguments = [found, ...[].slice.call(arguments, 1)] // Passes all arguments. Even those that is not specified above.
        // tslint:disable-next-line:no-invalid-this
        return originalResolveFilename.apply(this, modifiedArguments)
      }
    }
    // tslint:disable-next-line:no-invalid-this
    return originalResolveFilename.apply(this, arguments)
  }

  return () => {
    Module._resolveFilename = originalResolveFilename
  }
}

function getCoreModules(builtinModules: string[] | undefined): { [key: string]: boolean } {
  builtinModules = builtinModules || [
    'assert',
    'buffer',
    'child_process',
    'cluster',
    'crypto',
    'dgram',
    'dns',
    'domain',
    'events',
    'fs',
    'http',
    'https',
    'net',
    'os',
    'path',
    'punycode',
    'querystring',
    'readline',
    'stream',
    'string_decoder',
    'tls',
    'tty',
    'url',
    'util',
    'v8',
    'vm',
    'zlib',
  ]

  const coreModules: { [key: string]: boolean } = {}
  for (const module of builtinModules) {
    coreModules[module] = true
  }

  return coreModules
}
