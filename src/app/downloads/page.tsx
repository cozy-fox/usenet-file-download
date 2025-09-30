'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface DownloadItem {
  name: string
  path: string
  modified: string
}

interface FileItem {
  name: string
  path: string
  size: number
  type: 'video' | 'audio' | 'image' | 'book' | 'software' | null
  supported: boolean
}

interface QueueItem {
  nzo_id: string
  filename: string
  status: string
  size: number
  sizeleft: number
  percentage: number
  timeleft: string
  eta: string
  priority: string
  category: string
  nzbname: string
  postproc_time: string
  avg_age: string
  loaded: string
  mb: number
  mbleft: number
}

interface QueueData {
  queue: QueueItem[]
  paused: boolean
  speed: string
  speedlimit: string
  quota: string
  have_warnings: boolean
  finish: string
  left_quota: string
  cache_art: string
  cache_size: string
  cache_max: string
  finishaction: string
  paused_all: boolean
  diskspace1: string
  diskspace2: string
  diskspacetotal1: string
  diskspacetotal2: string
  loadavg: string
  version: string
}

export default function DownloadsPage() {
  const searchParams = useSearchParams()
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [queueData, setQueueData] = useState<QueueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [queueLoading, setQueueLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedDownload, setSelectedDownload] = useState<DownloadItem | null>(null)
  const [files, setFiles] = useState<FileItem[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'queue' | 'completed'>('queue')

  useEffect(() => {
    fetchDownloads()
    fetchQueue()
    
    // Check for success message from URL params
    const message = searchParams.get('message')
    if (message === 'download_started') {
      setSuccessMessage('Download started successfully! You can monitor its progress below.')
      setActiveTab('queue') // Switch to queue tab to show the new download
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000)
    }
    
    // Set up polling for queue updates every 5 seconds
    const interval = setInterval(fetchQueue, 5000)
    return () => clearInterval(interval)
  }, [searchParams])

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

  const fetchQueue = async () => {
    try {
      setQueueLoading(true)
      const response = await fetch('/api/downloads/queue')
      const data = await response.json()
      
      if (data.success) {
        setQueueData(data.data)
      } else {
        console.error('Queue fetch error:', data.error)
      }
    } catch (err) {
      console.error('Queue fetch error:', err)
    } finally {
      setQueueLoading(false)
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
    
    // For supported videos, audio, images, and books, open in viewer
    if (file.supported && file.type && ['video', 'audio', 'image', 'book'].includes(file.type)) {
      window.open(`/viewer?type=${file.type}&url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(file.name)}`, '_blank')
    } else {
      // For software and unsupported files, open directly
      window.open(fileUrl, '_blank')
    }
  }

  const handleDownloadFile = (file: FileItem) => {
    // Create a URL for the file
    const fileUrl = `/api/downloads/file?path=${encodeURIComponent(file.path)}`
    
    // Create a temporary link element to trigger download
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleQueueAction = async (nzoId: string, action: 'pause' | 'resume' | 'delete') => {
    try {
      const response = await fetch('/api/downloads/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nzo_id: nzoId,
          action: action
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Refresh queue data
        fetchQueue()
      } else {
        setError(data.error || `Failed to ${action} download`)
      }
    } catch (err) {
      setError(`Failed to ${action} download`)
      console.error('Queue action error:', err)
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

  const getFileTypeIcon = (type: string | null) => {
    switch (type) {
      case 'video': return '🎬'
      case 'audio': return '🎵'
      case 'image': return '🖼️'
      case 'book': return '📚'
      case 'software': return '💾'
      default: return '📄'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'downloading': return 'text-blue-600'
      case 'paused': return 'text-yellow-600'
      case 'completed': return 'text-green-600'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'downloading': return '⬇️'
      case 'paused': return '⏸️'
      case 'completed': return '✅'
      case 'failed': return '❌'
      default: return '📋'
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Downloads
        </h1>
        <p className="text-gray-600">
          Monitor active downloads and view completed files
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit mx-auto">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'queue'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Active Downloads ({queueData?.queue.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'completed'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Completed ({downloads.length})
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">{successMessage}</div>
            </div>
          </div>
        </div>
      )}

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

      {/* Active Downloads Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {queueLoading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Loading active downloads...</div>
            </div>
          ) : queueData && queueData.queue.length > 0 ? (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    Active Downloads ({queueData.queue.length})
                  </h2>
                  <div className="text-sm text-gray-500">
                    Speed: {queueData.speed} | ETA: {queueData.finish}
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {queueData.queue.map((item) => (
                  <div key={item.nzo_id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{getStatusIcon(item.status)}</span>
                          <h3 className="text-lg font-medium text-gray-900">
                            {item.filename}
                          </h3>
                          <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>{item.percentage}% complete</span>
                            <span>{formatFileSize(item.size - item.sizeleft)} / {formatFileSize(item.size)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Time left: {item.timeleft}</span>
                          <span>ETA: {item.eta}</span>
                          {item.category && <span>Category: {item.category}</span>}
                          <span>Priority: {item.priority}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        {item.status.toLowerCase() === 'downloading' ? (
                          <button
                            onClick={() => handleQueueAction(item.nzo_id, 'pause')}
                            className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                          >
                            Pause
                          </button>
                        ) : (
                          <button
                            onClick={() => handleQueueAction(item.nzo_id, 'resume')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          >
                            Resume
                          </button>
                        )}
                        <button
                          onClick={() => handleQueueAction(item.nzo_id, 'delete')}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <p className="text-lg">No active downloads</p>
                <p className="text-sm mt-2">Your active downloads will appear here</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completed Downloads List */}
      {activeTab === 'completed' && (
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Loading completed downloads...</div>
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
                      className={`flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 ${
                        file.supported ? 'bg-green-50 border-green-200' : ''
                      }`}
                    >
                      <div 
                        onClick={() => handleFileClick(file)}
                        className="flex items-center space-x-3 flex-1 cursor-pointer"
                      >
                        <span className="text-xl">{getFileTypeIcon(file.type)}</span>
                        <div>
                          <div className="font-medium text-gray-900">{file.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatFileSize(file.size)} • {file.type || 'unsupported'}
                            {file.supported && <span className="ml-2 text-green-600 text-xs">✓ supported</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadFile(file)
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Download
                        </button>
                        <div className="text-gray-400">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">No files found</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
