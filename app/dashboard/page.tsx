import { Metadata } from 'next';
import { DashboardClient } from './dashboard-client';

export const metadata: Metadata = {
  title: 'Energy Dashboard',
  description: 'Real-time office energy monitoring',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
