'use client'

import { useState, useEffect } from 'react'

interface DownloadItem {
  name: string
  path: string
  modified: string
}

interface FileItem {
  name: string
  path: string
  size: number
  type: 'video' | 'audio' | 'image' | 'book' | 'software'
}

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDownload, setSelectedDownload] = useState<DownloadItem | null>(null)
  const [files, setFiles] = useState<FileItem[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchDownloads()
  }, [])

  const fetchDownloads = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/downloads/list')
      const data = await response.json()
      
      if (data.success) {
        setDownloads(data.data)
      } else {
        setError(data.error || 'Failed to fetch downloads')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Downloads fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadClick = async (download: DownloadItem) => {
    setSelectedDownload(download)
    setShowModal(true)
    setFilesLoading(true)
    
    try {
      const response = await fetch(`/api/downloads/files?path=${encodeURIComponent(download.path)}`)
      const data = await response.json()
      
      if (data.success) {
        setFiles(data.data)
      } else {
        setError(data.error || 'Failed to fetch files')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Files fetch error:', err)
    } finally {
      setFilesLoading(false)
    }
  }

  const handleFileClick = (file: FileItem) => {
    // Create a URL for the file
    const fileUrl = `/api/downloads/file?path=${encodeURIComponent(file.path)}`
    
    // For videos, audio, images, and books, open in viewer
    if (['video', 'audio', 'image', 'book'].includes(file.type)) {
      window.open(`/viewer?type=${file.type}&url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(file.name)}`, '_blank')
    } else {
      // For software and other types, open directly
      window.open(fileUrl, '_blank')
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

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎬'
      case 'audio': return '🎵'
      case 'image': return '🖼️'
      case 'book': return '📚'
      case 'software': return '💾'
      default: return '📄'
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Downloads
        </h1>
        <p className="text-gray-600">
          View and manage your completed downloads
        </p>
      </div>

      {/* Error Message */}
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

      {/* Downloads List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading downloads...</div>
        </div>
      ) : downloads.length > 0 ? (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Completed Downloads ({downloads.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {downloads.map((download, index) => (
              <div key={index} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {download.name}
                    </h3>
                    <div className="text-sm text-gray-500">
                      Modified: {new Date(download.modified).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadClick(download)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    View Files
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <p className="text-lg">No completed downloads found</p>
            <p className="text-sm mt-2">Your completed downloads will appear here</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedDownload && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Files in: {selectedDownload.name}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {filesLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading files...</div>
                </div>
              ) : files.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      onClick={() => handleFileClick(file)}
                      className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{getFileTypeIcon(file.type)}</span>
                        <div>
                          <div className="font-medium text-gray-900">{file.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatFileSize(file.size)} • {file.type}
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">No supported files found</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
