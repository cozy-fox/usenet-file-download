import { NextRequest, NextResponse } from 'next/server'
import { SearchRequestSchema } from '@/lib/schemas'
import { searchAllIndexers } from '@/lib/search-engine'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate search parameters
    const searchRequest = SearchRequestSchema.parse({
      query: searchParams.get('q') || '',
      category: searchParams.get('cat') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    })

    if (!searchRequest.query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search query is required',
        },
        { status: 400 }
      )
    }

    // Search all indexers simultaneously
    const startTime = Date.now()
    const searchResult = await searchAllIndexers(
      searchRequest.query,
      searchRequest.category,
      searchRequest.limit,
      searchRequest.offset
    )
    const searchTime = (Date.now() - startTime) / 1000

    // Save search to database (optional - for analytics)

    const response = {
      success: true,
      data: searchResult.results,
      meta: {
        query: searchRequest.query,
        category: searchRequest.category,
        totalResults: searchResult.total,
        currentPageResults: searchResult.results.length,
        offset: searchRequest.offset,
        limit: searchRequest.limit,
        searchTime,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Search error:', error)
    
    // Check if it's a configuration error
    if (error instanceof Error && (error as any).code) {
      const configError = error as any;
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration Error',
          message: configError.message,
          code: configError.code,
          redirectTo: configError.redirectTo,
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

