import { NextRequest, NextResponse } from 'next/server';
import config from '../../../../config.json';

export const dynamic = 'force-dynamic';

const SAB_URL = config.sabnzbd.url;
const SAB_KEY = config.sabnzbd.apiKey;

// GET - Get specific download status by nzo_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nzoId = searchParams.get('nzo_id');

    if (!nzoId) {
      return NextResponse.json(
        { error: 'nzo_id parameter is required' },
        { status: 400 }
      );
    }

    if (!SAB_KEY) {
      return NextResponse.json(
        { error: 'SABnzbd API key not configured' },
        { status: 400 }
      );
    }

    // Get detailed information about the specific download
    const api = new URL('/api', SAB_URL);
    api.searchParams.set('mode', 'get_files');
    api.searchParams.set('value', nzoId);
    api.searchParams.set('apikey', SAB_KEY);
    api.searchParams.set('output', 'json');

    const response = await fetch(api.toString(), { method: 'GET' });
    
    if (!response.ok) {
      throw new Error(`SABnzbd HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.files) {
      return NextResponse.json(
        { error: 'Download not found or invalid response' },
        { status: 404 }
      );
    }

    // Transform the files data
    const files = data.files.map((file: any) => ({
      filename: file.filename,
      size: file.bytes,
      status: file.status,
      nzf_id: file.nzf_id,
      completed: file.completed,
      percentage: file.percentage
    }));

    return NextResponse.json({
      success: true,
      data: {
        nzo_id: nzoId,
        files: files,
        total_files: files.length,
        completed_files: files.filter((f: any) => f.completed).length
      }
    });

  } catch (error) {
    console.error('Error fetching download status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch download status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Pause/Resume/Delete download
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nzo_id, action } = body;

    if (!nzo_id || !action) {
      return NextResponse.json(
        { error: 'nzo_id and action are required' },
        { status: 400 }
      );
    }

    if (!SAB_KEY) {
      return NextResponse.json(
        { error: 'SABnzbd API key not configured' },
        { status: 400 }
      );
    }

    let mode = '';
    switch (action) {
      case 'pause':
        mode = 'pause';
        break;
      case 'resume':
        mode = 'resume';
        break;
      case 'delete':
        mode = 'queue';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: pause, resume, or delete' },
          { status: 400 }
        );
    }

    const api = new URL('/api', SAB_URL);
    api.searchParams.set('mode', mode);
    api.searchParams.set('value', nzo_id);
    api.searchParams.set('apikey', SAB_KEY);
    api.searchParams.set('output', 'json');

    if (action === 'delete') {
      api.searchParams.set('del_files', '1'); // Also delete files
    }

    const response = await fetch(api.toString(), { method: 'POST' });
    
    if (!response.ok) {
      throw new Error(`SABnzbd HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: `Download ${action}d successfully`,
      data: data
    });

  } catch (error) {
    console.error('Error managing download:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to manage download',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
