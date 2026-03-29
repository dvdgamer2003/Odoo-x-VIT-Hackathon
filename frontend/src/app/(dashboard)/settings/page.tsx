'use client';

import * as React from 'react';
import { useTemplates, useCreateTemplate } from '@/hooks/useApprovals';
import { SkeletonTable } from '@/components/shared/skeleton';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function SettingsTemplatesPage() {
  const { data: templates, isLoading } = useTemplates();
  const createMutation = useCreateTemplate();
  
  const [name, setName] = React.useState('');
  const [isDefault, setIsDefault] = React.useState(false);

  if (isLoading) return <SkeletonTable rows={5} />;

  const handleCreate = () => {
    if (!name) return toast.error('Name required');
    createMutation.mutate({ name, isDefault }, {
       onSuccess: () => {
         setName('');
         setIsDefault(false);
       }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
         <div className="surface-elevated px-4 py-4">
        <h1 className="text-2xl font-bold tracking-tight">Approval Templates</h1>
        <p className="text-muted-foreground mt-1 text-sm">Design workflows for expense approvals based on rules</p>
      </div>

         <Card className="border-border/80 bg-card/90">
         <CardHeader>
           <CardTitle>Create Template</CardTitle>
           <CardDescription>A template defines the route and people an expense must pass through</CardDescription>
         </CardHeader>
         <CardContent>
           <div className="flex gap-4 items-end">
             <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Template Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Executive Travel Protocol" />
             </div>
             <div className="flex items-center space-x-2 pb-2">
                <input type="checkbox" id="isDefault" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="rounded border-gray-300" />
                <label htmlFor="isDefault" className="text-sm font-medium">Set as Default Template</label>
             </div>
             <Button onClick={handleCreate} disabled={createMutation.isPending}><Plus className="w-4 h-4 mr-2" /> Add Template</Button>
           </div>
         </CardContent>
      </Card>

      <div className="grid gap-6">
        {templates?.map((t: any) => (
           <Card key={t.id} className="group relative overflow-hidden border-border/80 bg-card/90">
              {t.isDefault && (
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">
                  Default Fallback
                </div>
              )}
              <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-muted-foreground" />
                    {t.name}
                 </CardTitle>
              </CardHeader>
              <CardContent>
                 {t.steps?.length === 0 ? (
                    <div className="text-muted-foreground text-sm italic py-4 border-2 border-dashed rounded flex flex-col items-center">
                       <p>No approvers assigned to this template.</p>
                       <Button variant="link" size="sm" className="mt-2">Add First Step</Button>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       <div className="flex items-center gap-4">
                          {t.steps?.map((step: any, idx: number) => (
                             <React.Fragment key={step.id}>
                               <div className="bg-muted px-4 py-2 rounded shadow-sm border text-sm flex items-center gap-3">
                                  <div className="font-medium">Step {step.stepOrder}</div>
                                  <div className="text-muted-foreground border-l pl-3">{step.approver?.name || 'Unknown'}</div>
                               </div>
                               {idx < t.steps.length - 1 && <div className="text-muted-foreground font-bold text-lg">&rarr;</div>}
                             </React.Fragment>
                          ))}
                          <Button variant="ghost" size="icon" className="rounded-full shrink-0"><Plus className="w-4 h-4 text-muted-foreground"/></Button>
                       </div>
                    </div>
                 )}
              </CardContent>
           </Card>
        ))}
      </div>
    </div>
  );
}

