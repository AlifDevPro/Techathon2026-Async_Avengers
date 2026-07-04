'use client';

import useSWR from 'swr';
import { DashboardState } from '../types';
import { DASHBOARD_POLL_MS } from '../simulation-config';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useDevices() {
  const { data, error, isLoading, mutate } = useSWR<DashboardState>(
    '/api/devices',
    fetcher,
    {
      refreshInterval: DASHBOARD_POLL_MS,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: DASHBOARD_POLL_MS - 500,
    }
  );

  return {
    state: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export async function toggleDevice(deviceId: string, newStatus: 'on' | 'off') {
  try {
    const response = await fetch('/api/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId,
        status: newStatus,
      }),
    });

    if (!response.ok) throw new Error('Failed to toggle device');
    return await response.json();
  } catch (error) {
    console.error('Error toggling device:', error);
    throw error;
  }
}
