'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ViewerPage() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type')
  const url = searchParams.get('url')
  const filename = searchParams.get('filename') || 'File'
  const [error, setError] = useState('')

  useEffect(() => {
    if (!type || !url) {
      setError('Missing type or url parameter')
    }
  }, [type, url])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (type === 'video') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-full max-w-6xl">
          <div className="mb-4 text-white text-center">
            <h1 className="text-xl font-semibold">{filename}</h1>
          </div>
          <video
            controls
            autoPlay
            className="w-full h-auto"
            style={{ maxHeight: '80vh' }}
          >
            <source src={url || ''} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    )
  }

  if (type === 'audio') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-full max-w-2xl text-center">
          <div className="mb-8 text-white">
            <h1 className="text-2xl font-semibold mb-2">{filename}</h1>
            <div className="text-gray-300">Now Playing</div>
          </div>
          <audio
            controls
            autoPlay
            className="w-full"
          >
            <source src={url || ''} type="audio/mpeg" />
            Your browser does not support the audio tag.
          </audio>
        </div>
      </div>
    )
  }

  if (type === 'image') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-6xl w-full">
          <div className="mb-4 text-center">
            <h1 className="text-xl font-semibold text-gray-800">{filename}</h1>
          </div>
          <div className="flex justify-center">
            <img
              src={url || ''}
              alt={filename}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    )
  }

  if (type === 'book') {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-screen">
          <div className="mb-4 p-4 bg-gray-50 border-b">
            <h1 className="text-xl font-semibold text-gray-800">{filename}</h1>
          </div>
          <iframe
            src={url || ''}
            className="w-full h-full border-0"
            title={filename}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Unsupported Type</h1>
        <p className="text-gray-600">This file type is not supported for viewing.</p>
        <a
          href={url || '#'}
          className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open File
        </a>
      </div>
    </div>
  )
}
