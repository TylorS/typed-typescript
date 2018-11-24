declare module "nsfw" {
  namespace nsfw {
    export interface Watcher {
      start(): Promise<void>
      stop(): Promise<void>
    }

    export interface CreateEvent {
      action: 0
      directory: string,
      file: string,
    }

    export interface DeleteEvent {
      action: 1
      directory: string,
      file: string,
    }

    export interface ModifiedEvent {
      action: 2,
      directory: string,
      file: string,
    }

    export interface RenamedEvent {
      action: 3,
      directory: string,
      oldFile: string,
      file: string,
    }

    export type Event = CreateEvent | DeleteEvent | ModifiedEvent | RenamedEvent

    export interface Options {
      debounceMS?: number,
      errorCallback?: (errors: any[]) => void,
    }
  }

  const nsfw: (directory: string, callback: (events: nsfw.Event[]) => void, options?: nsfw.Options) => Promise<nsfw.Watcher>

  export = nsfw
}
