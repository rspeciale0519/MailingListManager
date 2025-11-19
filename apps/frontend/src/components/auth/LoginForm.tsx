import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Button, Input } from '@/shared/ui';
import { FormField, FormLabel, FormError } from '@/shared/forms';
import { useAuth } from '@/hooks';
import { ROUTES } from '@/constants/routes';

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginForm() {
  const { login, isLoggingIn } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
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

      <FormField>
        <div className="flex items-center justify-between">
          <FormLabel htmlFor="password" required>
            Password
          </FormLabel>
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password', {
            required: 'Password is required',
          })}
        />
        <FormError message={errors.password?.message} />
      </FormField>

      <Button type="submit" className="w-full" disabled={isLoggingIn}>
        {isLoggingIn ? 'Signing in...' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link
          to={ROUTES.REGISTER}
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
