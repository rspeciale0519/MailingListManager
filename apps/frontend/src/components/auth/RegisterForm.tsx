import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Button, Input } from '@/shared/ui';
import { FormField, FormLabel, FormError } from '@/shared/forms';
import { useAuth } from '@/hooks';
import { ROUTES } from '@/constants/routes';
import type { RegisterInput } from '@/types';

type RegisterFormData = RegisterInput & {
  confirm_password: string;
};

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirm_password, ...registerData } = data;
    registerUser(registerData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormField>
        <FormLabel htmlFor="first_name" required>
          First Name
        </FormLabel>
        <Input
          id="first_name"
          autoComplete="given-name"
          {...register('first_name', {
            required: 'First name is required',
          })}
        />
        <FormError message={errors.first_name?.message} />
      </FormField>

      <FormField>
        <FormLabel htmlFor="last_name" required>
          Last Name
        </FormLabel>
        <Input
          id="last_name"
          autoComplete="family-name"
          {...register('last_name', {
            required: 'Last name is required',
          })}
        />
        <FormError message={errors.last_name?.message} />
      </FormField>

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
        <FormLabel htmlFor="org_name" required>
          Organization Name
        </FormLabel>
        <Input
          id="org_name"
          {...register('org_name', {
            required: 'Organization name is required',
          })}
        />
        <FormError message={errors.org_name?.message} />
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
      </FormField>

      <FormField>
        <FormLabel htmlFor="confirm_password" required>
          Confirm Password
        </FormLabel>
        <Input
          id="confirm_password"
          type="password"
          autoComplete="new-password"
          {...register('confirm_password', {
            required: 'Please confirm your password',
            validate: (value) =>
              value === password || 'Passwords do not match',
          })}
        />
        <FormError message={errors.confirm_password?.message} />
      </FormField>

      <Button type="submit" className="w-full" disabled={isRegistering}>
        {isRegistering ? 'Creating account...' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
