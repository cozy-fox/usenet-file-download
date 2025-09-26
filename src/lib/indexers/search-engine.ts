import { SearchResult } from '../schemas'
import { INDEXER_CONFIGS, IndexerConfig } from '../config/indexer-config'

// Newznab API search (for NZBGeek, NZBFinder)
async function searchNewznab(indexer: IndexerConfig, query: string, category?: string, limit: number = 50): Promise<SearchResult[]> {
  const searchParams = new URLSearchParams({
    apikey: indexer.apiKey!,
    t: 'search',
    q: query,
    limit: limit.toString(),
  })

  if (category) {
    searchParams.set('cat', category)
  }

  const url = `${indexer.url}/api?${searchParams.toString()}`
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Usenet-Scraper/1.0',
      },
      signal: AbortSignal.timeout(indexer.timeout * 1000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const xml = await response.text()
    return parseNewznabXML(xml, indexer.name)
  } catch (error) {
    console.error(`Newznab search error for ${indexer.name}:`, error)
    return []
  }
}

// Parse Newznab XML response
function parseNewznabXML(xml: string, indexerName: string): SearchResult[] {
  // Simple XML parsing for RSS format
  const results: SearchResult[] = []
  
  // Extract items using regex (simple approach)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1]
    
    const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)
    const linkMatch = itemXml.match(/<link>(.*?)<\/link>/)
    const guidMatch = itemXml.match(/<guid>(.*?)<\/guid>/)
    const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)
    const sizeMatch = itemXml.match(/<enclosure[^>]*length="([^"]*)"[^>]*>/)
    const categoryMatch = itemXml.match(/<category><!\[CDATA\[(.*?)\]\]><\/category>|<category>(.*?)<\/category>/)
    
    if (titleMatch && linkMatch) {
      const title = titleMatch[1] || titleMatch[2] || ''
      const link = linkMatch[1] || ''
      const guid = guidMatch?.[1] || link
      const pubDate = pubDateMatch?.[1] || new Date().toISOString()
      const size = parseInt(sizeMatch?.[1] || '0')
      const category = categoryMatch?.[1] || categoryMatch?.[2] || 'Unknown'
      
      results.push({
        id: guid,
        title: title.trim(),
        size,
        category,
        posted: pubDate,
        nzbId: guid,
        indexer: indexerName,
      })
    }
  }
  
  return results
}

// Main search function - queries all enabled indexers simultaneously
export async function searchAllIndexers(query: string, category?: string, limit: number = 50): Promise<SearchResult[]> {
  const enabledIndexers = INDEXER_CONFIGS.filter(indexer => indexer.enabled)
  
  console.log(`🔍 Searching ${enabledIndexers.length} indexers for: "${query}"`)
  
  // Create search promises for all indexers
  const searchPromises = enabledIndexers.map(async (indexer) => {
    try {
      const results = await searchNewznab(indexer, query, category, limit)
      console.log(`✅ ${indexer.name}: Found ${results.length} results`)
      return results
    } catch (error) {
      console.error(`❌ ${indexer.name}: Search failed:`, error)
      return []
    }
  })
  
  // Wait for all searches to complete
  const allResults = await Promise.all(searchPromises)
  
  // Flatten and deduplicate results
  const flatResults = allResults.flat()
  const deduplicatedResults = deduplicateResults(flatResults)
  
  // Sort by posted date (newest first) and limit
  const sortedResults = deduplicatedResults
    .sort((a, b) => new Date(b.posted).getTime() - new Date(a.posted).getTime())
  
  console.log(`🎯 Total results: ${sortedResults.length} (after deduplication)`)
  
  return sortedResults
}

// Deduplicate results based on title similarity
function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>()
  const deduplicated: SearchResult[] = []
  
  for (const result of results) {
    // Create a normalized key for deduplication
    const normalizedTitle = result.title.toLowerCase().replace(/[^\w\s]/g, '').trim()
    const key = `${normalizedTitle}-${result.size}`
    
    if (!seen.has(key)) {
      seen.add(key)
      deduplicated.push(result)
    }
  }
  
  return deduplicated
}
