import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import { join, resolve } from 'path'

export const dynamic = 'force-dynamic'

// Use environment variable or fallback to relative path
const DOWNLOADS_PATH = process.env.DOWNLOADS_PATH || resolve(process.cwd(), 'sabnzbd-config/Downloads/complete')

export async function GET(req: NextRequest) {
  try {
    // Read the complete downloads directory
    const items = await readdir(DOWNLOADS_PATH)
    
    const downloads = []
    
    for (const item of items) {
      const itemPath = join(DOWNLOADS_PATH, item)
      const stats = await stat(itemPath)
      
      // Skip if it's not a directory
      if (!stats.isDirectory()) continue
      
      // Skip folders that start with "_FAILED_"
      if (item.startsWith('_FAILED_')) continue
      
      downloads.push({
        name: item,
        path: itemPath,
        modified: stats.mtime.toISOString()
      })
    }
    
    // Sort by modification date (newest first)
    downloads.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
    
    return NextResponse.json({
      success: true,
      data: downloads
    })
    
  } catch (error: any) {
    console.error('Error reading downloads directory:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to read downloads directory' 
      },
      { status: 500 }
    )
  }
}
