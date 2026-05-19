import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

async function verifyToken(token: string): Promise<{valid: boolean, role: string} | null> {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/api/v1/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('aegis_token')?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/doctor') || pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    const verification = await verifyToken(token);
    if (!verification || !verification.valid) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    const role = verification.role;

    if (pathname.startsWith('/doctor')) {
      if (role !== 'DOCTOR' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/patient', request.url));
      }
    }

    if (pathname.startsWith('/admin')) {
      if (role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/doctor', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/doctor/:path*', '/admin/:path*'],
};
