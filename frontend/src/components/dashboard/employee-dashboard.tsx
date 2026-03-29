'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenses } from '@/hooks/useExpenses';
import { SkeletonCard } from '@/components/shared/skeleton';
import { CheckCircle, Clock, FileText, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function EmployeeDashboard() {
  const { data: pending, isLoading: loadingPending } = useExpenses({
    status: 'PENDING',
    page: 1,
    limit: 1,
  });
  const { data: approved, isLoading: loadingApproved } = useExpenses({
    status: 'APPROVED',
    page: 1,
    limit: 1,
  });
  const { data: allMine, isLoading: loadingAll } = useExpenses({
    page: 1,
    limit: 1,
  });

  const isLoading = loadingPending || loadingApproved || loadingAll;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const pendingCount = pending?.meta?.total ?? 0;
  const approvedCount = approved?.meta?.total ?? 0;
  const totalMine = allMine?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="surface-elevated flex flex-col gap-3 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            My reimbursements
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track your submissions and follow up on pending requests.
          </p>
        </div>
        <Button asChild className="shadow-sm">
          <Link href="/expenses/new">
            <Plus className="h-4 w-4 mr-2" />
            New expense
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My expenses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMine}</div>
            <p className="text-xs text-muted-foreground mt-1">Total submissions</p>
          </CardContent>
        </Card>

        <Card className="metric-card border-yellow-400/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="metric-card border-emerald-400/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Cleared requests</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/expenses">View all my expenses</Link>
        </Button>
        <Button variant="ghost" asChild className="w-full sm:w-auto">
          <Link href="/expenses/new" className="inline-flex items-center">
            Draft another request
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
