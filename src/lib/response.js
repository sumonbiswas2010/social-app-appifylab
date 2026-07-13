import { NextResponse } from 'next/server';

export function ok(data = null, message = 'OK', status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}
