import { SourceFile } from 'typescript'

const EXPORT_REGEX = /export |module.exports|exports/

export const hasExports = ({ text }: SourceFile): boolean => EXPORT_REGEX.test(text)
