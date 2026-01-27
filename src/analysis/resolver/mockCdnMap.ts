export type CdnEntry = {
  type: "channel" | "vod"
  url: string
  label?: string
}

export const MOCK_CDN_MAP: Record<string, CdnEntry> = {
  // Example channel IDs
  "ch-live-1": {
    type: "channel",
    url: "https://example.cdn.com/live/channel1/master.m3u8",
    label: "Live Channel 1",
  },
  "ch-live-2": {
    type: "channel",
    url: "https://example.cdn.com/live/channel2/master.m3u8",
    label: "Live Channel 2",
  },
  "ch-sports": {
    type: "channel",
    url: "https://example.cdn.com/live/sports/master.m3u8",
    label: "Sports Channel",
  },

  // Example VOD IDs
  "vod-movie-123": {
    type: "vod",
    url: "https://example.cdn.com/vod/movies/123/master.m3u8",
    label: "Movie 123",
  },
  "vod-series-456": {
    type: "vod",
    url: "https://example.cdn.com/vod/series/456/master.m3u8",
    label: "Series Episode 456",
  },
  "vod-documentary-789": {
    type: "vod",
    url: "https://example.cdn.com/vod/docs/789/master.m3u8",
    label: "Documentary 789",
  },
}
