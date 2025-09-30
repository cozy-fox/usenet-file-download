import { NextRequest, NextResponse } from 'next/server';
import config from '../../../../config.json';

export const dynamic = 'force-dynamic';

const SAB_URL = config.sabnzbd.url;
const SAB_KEY = config.sabnzbd.apiKey;

// GET - Get SABnzbd queue status
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

    // Transform the queue data to a more usable format
    const queueItems = data.queue.slots?.map((item: any) => ({
      nzo_id: item.nzo_id,
      filename: item.filename,
      status: item.status,
      size: item.mb * 1024 * 1024, // Convert MB to bytes
      sizeleft: item.mbleft * 1024 * 1024, // Convert MB to bytes
      percentage: item.percentage,
      timeleft: item.timeleft,
      eta: item.eta,
      priority: item.priority,
      category: item.cat,
      nzbname: item.nzbname,
      postproc_time: item.postproc_time,
      avg_age: item.avg_age,
      loaded: item.loaded,
      mb: item.mb,
      mbleft: item.mbleft
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        queue: queueItems,
        paused: data.queue.paused,
        speed: data.queue.speed,
        speedlimit: data.queue.speedlimit,
        quota: data.queue.quota,
        have_warnings: data.queue.have_warnings,
        finish: data.queue.finish,
        left_quota: data.queue.left_quota,
        cache_art: data.queue.cache_art,
        cache_size: data.queue.cache_size,
        cache_max: data.queue.cache_max,
        finishaction: data.queue.finishaction,
        paused_all: data.queue.paused_all,
        diskspace1: data.queue.diskspace1,
        diskspace2: data.queue.diskspace2,
        diskspacetotal1: data.queue.diskspacetotal1,
        diskspacetotal2: data.queue.diskspacetotal2,
        loadavg: data.queue.loadavg,
        version: data.queue.version
      }
    });

  } catch (error) {
    console.error('Error fetching SABnzbd queue:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch download queue',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
