'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import apiClient from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { Building2, Globe, UserPlus } from 'lucide-react';

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  companyName: z.string().min(2, { message: 'Company name is required' }),
  country: z.string().min(2, { message: 'Country is required' }),
});

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { country: 'US' }, // Default
  });

  const onSubmit = async (data: SignupValues) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/signup', data);
      
      const { user, accessToken } = response.data;
      
      // Set the supplementary cookie for Next.js middleware
      document.cookie = `auth-status=true; path=/; max-age=${7 * 24 * 60 * 60}`;
      
      login(user, accessToken);
      toast.success('Account created successfully!');
      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 p-4 py-8 md:grid-cols-[1.1fr_0.9fr] md:py-12">
      <section className="hidden rounded-3xl border border-border/70 bg-gradient-to-br from-chart-2 via-primary/70 to-primary p-8 text-white shadow-xl md:flex md:flex-col md:justify-between">
        <div>
          <p className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs uppercase tracking-[0.2em]">
            Team Onboarding
          </p>
          <h1 className="mt-5 font-heading text-4xl leading-tight">
            Launch your reimbursement workspace in minutes.
          </h1>
          <p className="mt-4 max-w-md text-sm/6 text-white/85">
            Set up your company profile once, then invite managers and employees to start routing expenses.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="flex items-center gap-2"><UserPlus className="size-4" /> Multi-role account bootstrap</p>
          <p className="flex items-center gap-2"><Building2 className="size-4" /> Company-level policy controls</p>
          <p className="flex items-center gap-2"><Globe className="size-4" /> Country and currency aware defaults</p>
        </div>
      </section>

      <div className="flex items-center justify-center">
        <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-lg backdrop-blur">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <CardDescription>
                Start your company reimbursement workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="bg-background/80"
                  {...register('name')}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className="bg-background/80"
                  {...register('email')}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  className="bg-background/80"
                  {...register('password')}
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company name</Label>
                <Input
                  id="companyName"
                  placeholder="Acme Corp"
                  className="bg-background/80"
                  {...register('companyName')}
                />
                {errors.companyName && <p className="text-sm text-red-500">{errors.companyName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select onValueChange={(value) => setValue('country', value)} defaultValue="US">
                  <SelectTrigger className="bg-background/80">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="IN">India</SelectItem>
                  </SelectContent>
                </Select>
                {errors.country && <p className="text-sm text-red-500">{errors.country.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-medium underline hover:text-primary">
                  Log in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

