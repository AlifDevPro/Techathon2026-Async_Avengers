import { NextResponse } from 'next/server';
import { getCurrentAlerts, getCurrentState } from '@/lib/device-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = getCurrentState();
    const alerts = getCurrentAlerts();

    return NextResponse.json(
      {
        alerts,
        state: {
          totalPower: state.totalPower,
          energyToday: state.energyToday,
          officeTime: state.officeTime,
          isOfficeHours: state.isOfficeHours,
          totalDevicesOn: state.totalDevicesOn,
        },
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}
