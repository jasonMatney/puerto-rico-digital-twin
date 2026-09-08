import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const current = request.cookies.get('prdt-demo-session')?.value;
  if (
    current &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      current,
    )
  )
    return NextResponse.next();
  const token = crypto.randomUUID();
  const headers = new Headers(request.headers);
  const cookies = (headers.get('cookie') || '')
    .split(';')
    .filter((c) => c.trim() && !c.trim().startsWith('prdt-demo-session='));
  cookies.push(`prdt-demo-session=${token}`);
  headers.set('cookie', cookies.join('; '));
  const response = NextResponse.next({ request: { headers } });
  response.cookies.set('prdt-demo-session', token, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
export const config = { matcher: ['/', '/municipios/:path*', '/api/:path*'] };
