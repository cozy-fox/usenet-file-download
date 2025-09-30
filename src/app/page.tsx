'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SearchResult } from '@/lib/schemas'

export default function HomePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [configError, setConfigError] = useState<{message: string, redirectTo?: string} | null>(null)

  const performSearch = async (searchQuery: string, searchCategory: string, searchOffset: number) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError('')
    setConfigError(null)
    setResults([])

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        ...(searchCategory && { cat: searchCategory }),
        offset: searchOffset.toString(),
      })

      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()

      if (data.success) {
        setResults(data.data)
      } else {
        // Check if it's a configuration error
        if (data.code && (data.code === 'CONFIG_MISSING' || data.code === 'CONFIG_INCOMPLETE')) {
          setConfigError({
            message: data.message,
            redirectTo: data.redirectTo
          })
        } else {
          setError(data.error || 'Search failed')
        }
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    await performSearch(query, category, 0)
  }

  const handleDownload = async (result: SearchResult) => {
    try {
      const response = await fetch('/api/downloads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nzbId: result.nzbId,
          title: result.title,
        }),
      })

      const data = await response.json()
      if (data.success) {
        // Redirect to downloads page with success message and active tab
        router.push('/downloads?tab=active')
      } else {
        setError(`Download failed: ${data.error}`)
      }
    } catch (err) {
      setError('Failed to start download')
      console.error('Download error:', err)
    }
  }
  
  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Usenet Search & Stream
        </h1>
        <p className="text-gray-600">
          Search and stream content from Usenet with ease
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for movies, TV shows, music..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="w-48">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="2000">Movies</option>
                <option value="5000">TV Shows</option>
                <option value="3000">Music</option>
                <option value="4000">Software</option>
                <option value="6000">Games</option>
                <option value="7000">Books</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          
        </form>
      </div>

      {/* Configuration Error Message */}
      {configError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Configuration Required</h3>
              <div className="mt-2 text-sm text-yellow-700">{configError.message}</div>
              {configError.redirectTo && (
                <div className="mt-3">
                  <button
                    onClick={() => router.push(configError.redirectTo!)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                  >
                    Go to Configuration
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Regular Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Search Results ({results.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {results.map((result, index) => (
              <div key={index} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {result.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Size: {formatFileSize(result.size)}</span>
                      {result.category && (
                        <span>Category: {result.category}</span>
                      )}
                      {result.group && <span>Group: {result.group}</span>}
                      <span>Posted: {new Date(result.posted).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleDownload(result)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && query && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <p className="text-lg">No results found for "{query}"</p>
            <p className="text-sm mt-2">Try different keywords or check your indexer configuration</p>
          </div>
        </div>
      )}
    </div>
  )
}