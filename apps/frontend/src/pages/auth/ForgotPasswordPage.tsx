import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button, Input } from '@/shared/ui';
import { FormField, FormLabel, FormError } from '@/shared/forms';
import { useAuth } from '@/hooks';
import { ROUTES } from '@/constants/routes';

interface ForgotPasswordFormData {
  email: string;
}

export function ForgotPasswordPage() {
  const { forgotPassword, isSendingResetEmail } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword(data.email);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Mailing List Manager
          </h1>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="mt-8 rounded-lg bg-white px-8 py-10 shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField>
              <FormLabel htmlFor="email" required>
                Email
              </FormLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              <FormError message={errors.email?.message} />
            </FormField>

            <Button
              type="submit"
              className="w-full"
              disabled={isSendingResetEmail}
            >
              {isSendingResetEmail ? 'Sending...' : 'Send reset link'}
            </Button>

            <Link
              to={ROUTES.LOGIN}
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
