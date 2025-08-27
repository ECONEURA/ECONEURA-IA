import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/login']
const protectedRoutes = ['/dashboard', '/invoices', '/flows', '/reports', '/settings', '/notifications']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }
  
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  if (pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next()
  }
  
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get('auth_token')?.value
    
    if (!token && typeof window !== 'undefined') {
      const localToken = localStorage.getItem('auth_token')
      if (!localToken) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}