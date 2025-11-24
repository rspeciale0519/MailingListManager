import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button, Input } from '@/shared/ui';
import { FormField, FormLabel, FormError } from '@/shared/forms';
import { useAuth } from '@/hooks';
import { ROUTES } from '@/constants/routes';
import { useEffect, useState } from 'react';

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [tokenError, setTokenError] = useState<string | null>(null);

  const { resetPassword, isResettingPassword } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>();

  const newPassword = watch('newPassword');

  // Check if token exists
  useEffect(() => {
    if (!token) {
      setTokenError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const onSubmit = (data: ResetPasswordFormData) => {
    if (!token) return;

    resetPassword({
      token,
      newPassword: data.newPassword,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Mailing List Manager</h1>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">Set new password</h2>
          <p className="mt-2 text-sm text-gray-600">Enter your new password below</p>
        </div>

        <div className="mt-8 rounded-lg bg-white px-8 py-10 shadow-sm border border-gray-200">
          {tokenError ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 p-4">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Invalid Reset Link</h3>
                  <p className="mt-1 text-sm text-red-700">{tokenError}</p>
                </div>
              </div>

              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormField>
                <FormLabel htmlFor="newPassword" required>
                  New Password
                </FormLabel>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register('newPassword', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain uppercase, lowercase, and number',
                    },
                  })}
                />
                <FormError message={errors.newPassword?.message} />
              </FormField>

              <FormField>
                <FormLabel htmlFor="confirmPassword" required>
                  Confirm Password
                </FormLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === newPassword || 'Passwords do not match',
                  })}
                />
                <FormError message={errors.confirmPassword?.message} />
              </FormField>

              <Button type="submit" className="w-full" disabled={isResettingPassword}>
                {isResettingPassword ? 'Resetting password...' : 'Reset password'}
              </Button>

              <Link
                to={ROUTES.LOGIN}
                className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
