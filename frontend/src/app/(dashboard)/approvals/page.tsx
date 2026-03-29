'use client';

import * as React from 'react';
import { usePendingApprovals, useApprove, useReject } from '@/hooks/useApprovals';
import { SkeletonTable } from '@/components/shared/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ApprovalsPage() {
  const { data: pendingItems, isLoading } = usePendingApprovals();
  const approveMutation = useApprove();
  const rejectMutation = useReject();

  const [selectedAction, setSelectedAction] = React.useState<{ expenseId: string, type: 'APPROVE' | 'REJECT' } | null>(null);
  const [comments, setComments] = React.useState('');

  if (isLoading) return <SkeletonTable rows={5} />;

  const expenses = pendingItems || [];

  const handleAction = () => {
    if (!selectedAction) return;
    
    if (selectedAction.type === 'APPROVE') {
      approveMutation.mutate({ expenseId: selectedAction.expenseId, comments }, {
        onSuccess: () => {
          setSelectedAction(null);
          setComments('');
        }
      });
    } else {
      rejectMutation.mutate({ expenseId: selectedAction.expenseId, comments }, {
        onSuccess: () => {
          setSelectedAction(null);
          setComments('');
        }
      });
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="surface-elevated flex items-center justify-between px-4 py-4">
        <h1 className="text-2xl font-bold tracking-tight">Pending Approvals</h1>
        <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          {expenses.length} Pending
        </div>
      </div>

      {expenses.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-dashed p-12 text-center text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mb-4 text-muted" />
          <CardTitle className="text-xl">All caught up!</CardTitle>
          <CardDescription className="mt-2 text-base">You have no pending expense approvals requiring your attention.</CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {expenses.map((e: any) => (
            <Card key={e.id} className="flex flex-col border-border/75 bg-card/90 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="border-b border-border/70 bg-muted/20 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{e.submittedBy.name}</CardTitle>
                    <CardDescription className="text-xs">{e.submittedBy.email}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{e.currency} {parseFloat(e.amount).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(e.date), 'MMM dd, yyyy')}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                   <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium bg-muted px-2 rounded-sm">{e.category}</span>
                   </div>
                   <div>
                     <span className="text-muted-foreground text-sm block mb-1">Description:</span>
                     <p className="text-sm line-clamp-2">{e.description}</p>
                   </div>
                   {e.receiptUrl && (
                     <a href={e.receiptUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline inline-block mt-2">
                       View Receipt
                     </a>
                   )}
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setSelectedAction({ expenseId: e.id, type: 'REJECT' })}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                  <Button 
                    variant="default" 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setSelectedAction({ expenseId: e.id, type: 'APPROVE' })}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={selectedAction !== null} onOpenChange={(open) => !open && setSelectedAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAction?.type === 'APPROVE' ? 'Approve Expense' : 'Reject Expense'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Comments {selectedAction?.type === 'REJECT' && <span className="text-destructive">*</span>}</label>
              <Input 
                placeholder={selectedAction?.type === 'APPROVE' ? 'Looks good! (Optional)' : 'Reason for rejection...'} 
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
               <Button variant="ghost" onClick={() => setSelectedAction(null)}>Cancel</Button>
               <Button 
                 variant={selectedAction?.type === 'APPROVE' ? 'default' : 'destructive'}
                 onClick={handleAction}
               >
                 {selectedAction?.type === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

