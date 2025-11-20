import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Button, Input } from '@/shared/ui';
import { FormField, FormLabel, FormError } from '@/shared/forms';
import { useAuth } from '@/hooks';
import { ROUTES } from '@/constants/routes';

interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  confirmPassword: string;
}

export function RegisterForm() {
  const { register: registerUser, isRegistering } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = (data: RegisterFormData) => {
    registerUser({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <FormField>
          <FormLabel htmlFor="firstName" required>
            First Name
          </FormLabel>
          <Input
            id="firstName"
            autoComplete="given-name"
            {...register('firstName', {
              required: 'First name is required',
            })}
          />
          <FormError message={errors.firstName?.message} />
        </FormField>

        <FormField>
          <FormLabel htmlFor="lastName" required>
            Last Name
          </FormLabel>
          <Input
            id="lastName"
            autoComplete="family-name"
            {...register('lastName', {
              required: 'Last name is required',
            })}
          />
          <FormError message={errors.lastName?.message} />
        </FormField>
      </div>

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
        <FormLabel htmlFor="password" required>
          Password
        </FormLabel>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
          })}
        />
        <FormError message={errors.password?.message} />
        <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
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
            validate: (value) => value === password || 'Passwords do not match',
          })}
        />
        <FormError message={errors.confirmPassword?.message} />
      </FormField>

      <Button type="submit" className="w-full" disabled={isRegistering}>
        {isRegistering ? 'Creating account...' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-primary-600 hover:text-primary-500">
          Sign in
        </Link>
      </p>
    </form>
  );
}
