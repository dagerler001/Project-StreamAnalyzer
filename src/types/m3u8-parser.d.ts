declare module "m3u8-parser" {
  export interface MediaGroupItem {
    uri?: string
    attributes?: Record<string, unknown>
    language?: string
    default?: boolean
  }

  export interface Manifest {
    playlists?: Array<{
      uri?: string
      attributes?: Record<string, unknown>
    }>
    mediaGroups?: {
      AUDIO?: Record<string, Record<string, MediaGroupItem>>
    }
    segments?: Array<{
      uri?: string
      duration?: number
    }>
    playlistType?: string
    endList?: boolean
    version?: number
  }

  export class Parser {
    manifest: Manifest
    push(data: string): void
    end(): void
  }
}
