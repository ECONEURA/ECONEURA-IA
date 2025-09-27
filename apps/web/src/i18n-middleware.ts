import { NextRequest, NextResponse } from 'next/server';

export function i18nMiddleware(_request: NextRequest) {
  return NextResponse.next();
}