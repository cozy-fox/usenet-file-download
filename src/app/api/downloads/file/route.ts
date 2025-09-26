import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const filePath = searchParams.get('path')
    
    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'Missing path parameter' },
        { status: 400 }
      )
    }
    
    // Check if file exists
    const stats = await stat(filePath)
    if (!stats.isFile()) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }
    
    // Read the file
    const fileBuffer = await readFile(filePath)
    
    // Get file extension for content type
    const ext = filePath.toLowerCase().substring(filePath.lastIndexOf('.'))
    
    let contentType = 'application/octet-stream'
    
    switch (ext) {
      case '.mp4':
      case '.avi':
      case '.mkv':
      case '.mov':
      case '.wmv':
      case '.flv':
      case '.webm':
      case '.m4v':
        contentType = `video/${ext.substring(1)}`
        break
      case '.mp3':
      case '.wav':
      case '.flac':
      case '.aac':
      case '.ogg':
      case '.wma':
      case '.m4a':
        contentType = `audio/${ext.substring(1)}`
        break
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.png':
        contentType = 'image/png'
        break
      case '.gif':
        contentType = 'image/gif'
        break
      case '.webp':
        contentType = 'image/webp'
        break
      case '.svg':
        contentType = 'image/svg+xml'
        break
      case '.pdf':
        contentType = 'application/pdf'
        break
      case '.epub':
        contentType = 'application/epub+zip'
        break
      case '.txt':
        contentType = 'text/plain'
        break
      case '.zip':
        contentType = 'application/zip'
        break
      case '.exe':
        contentType = 'application/x-msdownload'
        break
    }
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': 'inline', // This tells browser to display instead of download
      },
    })
    
  } catch (error: any) {
    console.error('Error serving file:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to serve file' 
      },
      { status: 500 }
    )
  }
}
