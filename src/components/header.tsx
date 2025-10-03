'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DiskSpace {
  disk_free: string
  disk_total: string
}

export default function Header() {
  const [diskSpace, setDiskSpace] = useState<DiskSpace | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDiskSpace()
    
    // Refresh disk space every 30 seconds
    const interval = setInterval(fetchDiskSpace, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDiskSpace = async () => {
    try {
      const response = await fetch('/api/system/disk-space')
      const data = await response.json()

      if (data.success) {
        setDiskSpace(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch disk space:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const getDiskSpaceColor = (freeStr: string, totalStr: string) => {
    // Extract numeric values from strings like "37.6 G" and "77.7 G"
    const freeNum = parseFloat(freeStr.replace(/[^\d.]/g, '')) || 0
    const totalNum = parseFloat(totalStr.replace(/[^\d.]/g, '')) || 0
    
    if (totalNum === 0) return 'text-gray-600'
    
    const percentage = (freeNum / totalNum) * 100
    if (percentage < 10) return 'text-red-600'
    if (percentage < 20) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Usenet Scraper
            </h1>
            
            {diskSpace && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Free:</span>
                <span className={`text-sm font-medium ${getDiskSpaceColor(diskSpace.disk_free, diskSpace.disk_total)}`}>
                  {diskSpace.disk_free}
                </span>
                <span className="text-sm text-gray-500">/</span>
                <span className="text-sm text-gray-500">
                  {diskSpace.disk_total}
                </span>
              </div>
            )}
            
            {loading && (
              <div className="text-sm text-gray-400">
                Loading...
              </div>
            )}
          </div>
          
          <nav className="flex space-x-4">
            <Link 
              href="/" 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              Search
            </Link>
            <Link 
              href="/downloads" 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              Downloads
            </Link>
            <Link 
              href="/config" 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              Config
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
