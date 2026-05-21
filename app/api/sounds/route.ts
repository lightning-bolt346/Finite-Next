import { NextRequest, NextResponse } from 'next/server';

const SOUND_URLS: Record<string, string> = {
  rain: 'https://cdn.freesound.org/previews/186/186711_321967-lq.mp3',
  heavy_rain: 'https://cdn.freesound.org/previews/235/235921_4387220-lq.mp3',
  cafe: 'https://cdn.freesound.org/previews/512/512130_918501-lq.mp3',
  fireplace: 'https://cdn.freesound.org/previews/234/234988_4397472-lq.mp3',
  forest: 'https://cdn.freesound.org/previews/401/401562_5121236-lq.mp3',
  ocean: 'https://cdn.freesound.org/previews/400/400402_5121236-lq.mp3',
  lofi: 'https://cdn.freesound.org/previews/618/618956_11861866-lq.mp3', 
  space: 'https://cdn.freesound.org/previews/476/476563_9034501-lq.mp3',
  library: 'https://cdn.freesound.org/previews/163/163623_2050110-lq.mp3',
  chimes: 'https://cdn.freesound.org/previews/652/652150_1015240-lq.mp3',
  tibetan: 'https://cdn.freesound.org/previews/118/118321_1170799-lq.mp3'
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const track = searchParams.get('track');

  if (!track || !SOUND_URLS[track]) {
    return new NextResponse('Track not found', { status: 404 });
  }

  try {
    const response = await fetch(SOUND_URLS[track], {
       headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': 'https://freesound.org/'
       }
    });
    if (!response.ok) throw new Error('Remote proxy failed with status: ' + response.status);
    
    // We proxy it to avoid CORS issues if we use Web Audio API directly
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });

  } catch (error) {
    return new NextResponse('Error fetching sound', { status: 500 });
  }
}
