import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const pictureUrl = new URL(request.url).searchParams.get('url')?.trim();

  if (!pictureUrl) {
    return NextResponse.json({ message: 'Missing picture URL.' }, { status: 400 });
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(pictureUrl);
  }
  catch {
    return NextResponse.json({ message: 'Invalid picture URL.' }, { status: 400 });
  }

  if (!parsedUrl.hostname.endsWith('googleusercontent.com')) {
    return NextResponse.json({ message: 'Unsupported picture host.' }, { status: 400 });
  }

  try {
    const response = await fetch(parsedUrl.toString(), { cache: 'no-store' });

    if (!response.ok) {
      return NextResponse.json({ message: 'Could not fetch profile photo.' }, { status: 502 });
    }

    const contentType = response.headers.get('content-type') ?? 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  }
  catch {
    return NextResponse.json({ message: 'Could not fetch profile photo.' }, { status: 502 });
  }
}
