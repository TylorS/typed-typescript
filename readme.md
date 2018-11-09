# @typed/typescript

> A collection of utilities for working with typescript source code.

## Node/CLI Tools 

- Find tsconfig.json
- Parse tsconfig.json 
- Compilation
- Configure your compilerOptions.paths
- TypeChecking in another process
- Configure SourceMap Support
- Logging `Diagnostic`s

## Parsing Tools 

- Find `Type`s and `Symbol`s in `SourceFile`s
- Find `Node`s by `Type`s and `Symbol`s
- Check if `Node` is exported
- Find the dependencies of a `SourceFile`
- Find "name" of `Node`
- JSON-formatted AST

## Plugin Tools

- Create Language Service 
- Editor Manipulation

## Reusable TSConfig

In your `tsconfig.json` you can extend one our our presets if you'd like, though
they were mostly made for use in `@typed` projects. 

> With TypeScript 3.2+ it's possible to use Node resolution to find configs from `extends`. Feel free to drop `/path/to/node_modules` from below.

```json
{
  "extends": "./node_modules/@typed/typescript/tsconfig/module.json"
}
```
```json
{
  "extends": "./node_modules/@typed/typescript/tsconfig/commonjs.json"
}
```
```json
{
  "extends": "./node_modules/@typed/typescript/tsconfig/dom.json"
}
```
