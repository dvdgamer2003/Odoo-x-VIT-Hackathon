'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import apiClient from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { CheckCircle2, ShieldCheck, WalletCards } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const login = useAuthStore((state) => state.login);
  
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', data);
      
      const { user, accessToken } = response.data;
      
      // Set the supplementary cookie for Next.js middleware
      document.cookie = `auth-status=true; path=/; max-age=${7 * 24 * 60 * 60}`;
      
      login(user, accessToken);
      toast.success('Logged in successfully!');
      router.push(callbackUrl);
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 p-4 py-8 md:grid-cols-[1.1fr_0.9fr] md:py-12">
      <section className="hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/90 via-primary/75 to-chart-1/80 p-8 text-primary-foreground shadow-xl md:flex md:flex-col md:justify-between">
        <div>
          <p className="inline-flex items-center rounded-full bg-white/18 px-3 py-1 text-xs uppercase tracking-[0.2em]">
            Finance Command Center
          </p>
          <h1 className="mt-5 font-heading text-4xl leading-tight">
            Keep reimbursements fast, fair, and fully visible.
          </h1>
          <p className="mt-4 max-w-md text-sm/6 text-primary-foreground/85">
            One place for employees, managers, and admins to submit, approve, and monitor every expense flow.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="flex items-center gap-2"><CheckCircle2 className="size-4" /> Built-in approval routing</p>
          <p className="flex items-center gap-2"><WalletCards className="size-4" /> Currency-aware totals</p>
          <p className="flex items-center gap-2"><ShieldCheck className="size-4" /> Role-based access controls</p>
        </div>
      </section>

      <div className="flex items-center justify-center">
        <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-lg backdrop-blur">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in to continue managing reimbursements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className="bg-background/80"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  className="bg-background/80"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Log in'}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-medium underline hover:text-primary">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

