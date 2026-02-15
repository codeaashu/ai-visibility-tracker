import { NextResponse } from 'next/server';
import { GET as getAnalytics } from '../route';

export async function GET(request: Request) {
  const response = await getAnalytics(request);
  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(data, { status: response.status });
  }

  return NextResponse.json({ trendData: data.trendData || [] });
}
