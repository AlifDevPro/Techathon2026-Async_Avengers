import { NextRequest, NextResponse } from 'next/server';
import { getCurrentState, toggleDevice as toggleDeviceInStore } from '@/lib/device-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = getCurrentState();

    return NextResponse.json(state, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, status } = body;

    if (!deviceId || (status !== 'on' && status !== 'off')) {
      return NextResponse.json(
        { error: 'Invalid deviceId or status' },
        { status: 400 }
      );
    }

    const state = toggleDeviceInStore(deviceId, status);
    return NextResponse.json(state);
  } catch (error) {
    console.error('Error updating device:', error);
    return NextResponse.json(
      { error: 'Failed to update device' },
      { status: 500 }
    );
  }
}
