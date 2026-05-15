import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function roleFromToken(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('aegis_token')?.value;
  const role = request.cookies.get('aegis_role')?.value ?? roleFromToken(token);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/doctor')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (role && role !== 'DOCTOR' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/patient', request.url));
    }
  }

  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/doctor', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/doctor/:path*', '/admin/:path*'],
};
