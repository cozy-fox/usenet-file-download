// Usenet Indexer Configuration
export interface IndexerConfig {
  name: string
  url: string
  apiKey?: string
  enabled: boolean
  timeout: number
  type: 'newznab' | 'html' | 'json'
  categories: string[]
}

export const INDEXER_CONFIGS: IndexerConfig[] = [
  {
    name: 'NZBFinder',
    url: 'https://nzbfinder.ws',
    apiKey: process.env.NZBFINDER_API_KEY!,
    enabled: true,
    timeout: 30,
    type: 'newznab',
    categories: ['2000', '5000', '3000', '4000', '6000'],
  },
]