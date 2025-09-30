import { SearchResult } from './schemas'

// Import config with error handling
let config: any;
try {
  config = require('../config.json');
} catch (error) {
  console.error('Failed to import config.json:', error);
  config = null;
}

// Newznab API search (for NZBGeek, NZBFinder)
async function searchNewznab(query: string, category?: string, limit: number = 50): Promise<SearchResult[]> {
  const searchParams = new URLSearchParams({
    apikey: config.indexer.apiKey,
    t: 'search',
    q: query,
    limit: limit.toString(),
  })

  if (category) {
    searchParams.set('cat', category)
  }

  const url = `${config.indexer.url}/api?${searchParams.toString()}`
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Usenet-Scraper/1.0',
      },
      signal: AbortSignal.timeout(config.indexer.timeout * 1000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const xml = await response.text()
    return parseNewznabXML(xml, config.indexer.name)
  } catch (error) {
    console.error(`Newznab search error for ${config.indexer.name}:`, error)
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

// Main search function - queries the single indexer
export async function searchAllIndexers(query: string, category?: string, limit: number = 50): Promise<SearchResult[]> {
  // Check if config is available
  if (!config) {
    const error = new Error('Configuration not found. Please configure your settings first.');
    (error as any).code = 'CONFIG_MISSING';
    (error as any).redirectTo = '/config';
    throw error;
  }

  // Check if indexer is properly configured
  if (!config.indexer || !config.indexer.name || !config.indexer.url || !config.indexer.apiKey) {
    const error = new Error('Indexer configuration is incomplete. Please check your settings.');
    (error as any).code = 'CONFIG_INCOMPLETE';
    (error as any).redirectTo = '/config';
    throw error;
  }

  if (!config.indexer.enabled) {
    console.log(`❌ Indexer ${config.indexer.name} is disabled`)
    return []
  }
  
  console.log(`🔍 Searching ${config.indexer.name} for: "${query}"`)
  
  try {
    const results = await searchNewznab(query, category, limit)
    console.log(`✅ ${config.indexer.name}: Found ${results.length} results`)
    
    // Sort by posted date (newest first)
    const sortedResults = results
      .sort((a, b) => new Date(b.posted).getTime() - new Date(a.posted).getTime())
    
    console.log(`🎯 Total results: ${sortedResults.length}`)
    
    return sortedResults
  } catch (error) {
    console.error(`❌ ${config.indexer.name}: Search failed:`, error)
    return []
  }
}

