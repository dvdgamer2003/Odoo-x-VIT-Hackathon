'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenseStats } from '@/hooks/useExpenses';
import { SkeletonCard } from '@/components/shared/skeleton';
import { Banknote, CheckCircle, ClipboardList, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function ManagerDashboard() {
  const { data: stats, isLoading } = useExpenseStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="surface-elevated flex flex-col gap-3 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" />
            Manager — Approvals & spend
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review pending requests and monitor company-wide expense activity.
          </p>
        </div>
        <Button asChild>
          <Link href="/approvals">Open approval queue</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total approved volume</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {parseFloat(String(stats?.totalApprovedAmount || 0)).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Company total (converted)</p>
          </CardContent>
        </Card>

        <Card className="metric-card border-yellow-400/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs your review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pending ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending in the company</p>
          </CardContent>
        </Card>

        <Card className="metric-card border-emerald-400/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved (count)</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.approved ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Historical approvals</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
