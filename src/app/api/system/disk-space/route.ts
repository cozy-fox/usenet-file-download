import { NextResponse } from 'next/server';
import config from '../../../../config.json';

export const dynamic = 'force-dynamic';

const SAB_URL = config.sabnzbd.url;
const SAB_KEY = config.sabnzbd.apiKey;

// GET - Get disk space information from SABnzbd
export async function GET() {
  try {
    if (!SAB_KEY) {
      return NextResponse.json(
        { error: 'SABnzbd API key not configured' },
        { status: 400 }
      );
    }

    const api = new URL('/api', SAB_URL);
    api.searchParams.set('mode', 'queue');
    api.searchParams.set('apikey', SAB_KEY);
    api.searchParams.set('output', 'json');

    const response = await fetch(api.toString(), { method: 'GET' });
    
    if (!response.ok) {
      throw new Error(`SABnzbd HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.queue) {
      return NextResponse.json(
        { error: 'Invalid response from SABnzbd' },
        { status: 500 }
      );
    }

    // Extract disk space information from SABnzbd queue response
    const diskSpace = {
      disk_free: data.queue.diskspace1_norm || '0.0 G',
      disk_total: data.queue.diskspacetotal1 || '0.0 G',
    };

    return NextResponse.json({
      success: true,
      data: diskSpace
    });

  } catch (error) {
    console.error('Error fetching disk space:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch disk space',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
