'use client';

import * as React from 'react';
import Link from 'next/link';
import { useExpenses } from '@/hooks/useExpenses';
import { SkeletonTable } from '@/components/shared/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';

export default function ExpensesPage() {
  const [statusFilter, setStatusFilter] = React.useState<string>('');
  const { data, isLoading } = useExpenses(statusFilter ? { status: statusFilter } : undefined);

  if (isLoading) return <SkeletonTable rows={10} />;

  const expenses = data?.data || [];

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="surface-elevated flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <h1 className="text-2xl font-bold tracking-tight">My Expenses</h1>
        <Button asChild>
          <Link href="/expenses/new">
            <Plus className="w-4 h-4 mr-2" /> New Expense
          </Link>
        </Button>
      </div>

      <div className="surface-elevated flex flex-wrap gap-2 px-3 py-3">
        <Button
          variant={statusFilter === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('')}
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('PENDING')}
        >
          Pending
        </Button>
        <Button
          variant={statusFilter === 'APPROVED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('APPROVED')}
        >
          Approved
        </Button>
        <Button
          variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('REJECTED')}
        >
          Rejected
        </Button>
      </div>

      <Card className="flex-1 overflow-hidden border-border/80 bg-card/90 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {expenses.map((e: any) => (
                <tr key={e.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-4">{format(new Date(e.date), 'MMM dd, yyyy')}</td>
                  <td className="px-4 py-4 max-w-[200px] truncate" title={e.description}>
                    {e.description}
                  </td>
                  <td className="px-4 py-4">{e.category}</td>
                  <td className="px-4 py-4 font-medium">
                    {e.currency} {parseFloat(e.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        e.status === 'APPROVED'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : e.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : e.status === 'CANCELLED'
                          ? 'bg-gray-100 text-gray-700 border-gray-200'
                          : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/expenses/${e.id}`}>Details</Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {!expenses.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No expenses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

