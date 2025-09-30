import { NextRequest, NextResponse } from 'next/server';
import config from '../../../../config.json';

export const dynamic = 'force-dynamic';

const SAB_URL = config.sabnzbd.url;
const SAB_KEY = config.sabnzbd.apiKey;

// GET - Get all downloads from SABnzbd history
export async function GET() {
  try {
    if (!SAB_KEY) {
      return NextResponse.json(
        { error: 'SABnzbd API key not configured' },
        { status: 400 }
      );
    }

    const api = new URL('/api', SAB_URL);
    api.searchParams.set('mode', 'history');
    api.searchParams.set('apikey', SAB_KEY);
    api.searchParams.set('output', 'json');
    // Remove failed=1 to get all downloads

    const response = await fetch(api.toString(), { method: 'GET' });
    
    if (!response.ok) {
      throw new Error(`SABnzbd HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(data.history.slots);

    if (!data.history) {
      return NextResponse.json(
        { error: 'Invalid response from SABnzbd' },
        { status: 500 }
      );
    }

    // Transform the history data to a more usable format
    const historyDownloads = data.history.slots?.map((item: any) => {
      // Determine if download failed based on fail_message or completeness
      const isFailed = !!(item.fail_message || (item.completeness === null && item.status === 'Failed'));
      const isCompleted = !isFailed && (item.completed || item.status === 'Completed');
      
      return {
        nzo_id: item.nzo_id,
        name: item.name,
        filename: item.filename,
        status: item.status,
        size: item.bytes * 1024 * 1024, // Convert MB to bytes
        category: item.cat,
        priority: item.priority,
        completed: item.completed,
        error: item.fail_message || '',
        modified: item.completed_time || item.failed_time,
        nzbname: item.nzbname,
        avg_age: item.avg_age,
        loaded: item.loaded,
        is_failed: isFailed,
        is_completed: isCompleted,
        completeness: item.completeness,
        download_time: item.download_time,
        postproc_time: item.postproc_time
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: historyDownloads
    });

  } catch (error) {
    console.error('Error fetching SABnzbd history:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch downloads history',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a download from history
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { nzo_id } = body;

    if (!nzo_id) {
      return NextResponse.json(
        { error: 'nzo_id is required' },
        { status: 400 }
      );
    }

    if (!SAB_KEY) {
      return NextResponse.json(
        { error: 'SABnzbd API key not configured' },
        { status: 400 }
      );
    }

    const api = new URL('/api', SAB_URL);
    api.searchParams.set('mode', 'history');
    api.searchParams.set('name', 'delete');
    api.searchParams.set('value', nzo_id);
    api.searchParams.set('apikey', SAB_KEY);
    api.searchParams.set('output', 'json');
    api.searchParams.set('del_files', '1'); // Also delete files

    const response = await fetch(api.toString(), { method: 'POST' });
    
    if (!response.ok) {
      throw new Error(`SABnzbd HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Download deleted from history successfully',
      data: data
    });

  } catch (error) {
    console.error('Error deleting failed download from history:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete download from history',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
