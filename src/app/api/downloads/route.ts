import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SAB_URL = process.env.SABNZBD_URL || 'http://localhost:8080';
const SAB_KEY = process.env.SABNZBD_API_KEY || process.env.SABNZBD_APIKEY || '';

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function sanitizeFilename(filename: string) {
  return decodeHtmlEntities(filename)
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200);
}

// Preferred (simplest/reliable): hand SAB the signed NZB URL
async function sabAddUrl(
  nzbUrl: string,
  opts?: { category?: string; priority?: number; nzbname?: string }
) {
  if (!SAB_KEY) throw new Error('Missing SABNZBD_API_KEY');
  const api = new URL('/api', SAB_URL);
  api.searchParams.set('mode', 'addurl');
  api.searchParams.set('apikey', SAB_KEY);
  api.searchParams.set('output', 'json');
  api.searchParams.set('name', nzbUrl);
  if (opts?.category) api.searchParams.set('cat', opts.category);
  if (opts?.priority !== undefined) api.searchParams.set('priority', String(opts.priority));
  if (opts?.nzbname) api.searchParams.set('nzbname', opts.nzbname);

  const res = await fetch(api.toString(), { method: 'POST' });
  if (!res.ok) throw new Error(`SAB HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (!json?.status) throw new Error(json?.error || 'SAB returned status=false');
  return json.nzo_ids?.[0] as string | undefined;
}

// ---- Route ----
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      nzbUrl,     // preferred: hand SAB the URL directly
      nzbId,      // legacy name you used; treated as a URL too if provided
      title,
      category,
      priority,
    }: {
      nzbUrl?: string;
      nzbId?: string;
      title?: string;
      category?: string;
      priority?: number;
    } = body;

    if (!SAB_KEY) {
      return NextResponse.json({ error: 'SAB key not configured' }, { status: 500 });
    }

    // Path A: if nzbUrl provided, let SAB fetch it (no file IO)
    const signedUrl = decodeHtmlEntities(nzbUrl || nzbId || '');
    if (signedUrl) {
      const jobId = await sabAddUrl(signedUrl, {
        category,
        priority,
        nzbname: title ? sanitizeFilename(title) : undefined,
      });
      return NextResponse.json({
        success: true,
        mode: 'addurl',
        jobId,
        message: 'Queued by URL in SABnzbd',
      });
    }

    // Path B: if no URL was provided, error (or you could fetch from other inputs)
    return NextResponse.json(
      { error: 'Missing nzbUrl or nzbId' },
      { status: 400 }
    );

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
