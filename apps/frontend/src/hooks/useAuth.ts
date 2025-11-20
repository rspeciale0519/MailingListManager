import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/shared/ui';
import { ROUTES } from '@/constants/routes';

/**
 * Hook for authentication operations
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
  } = useAuthStore();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      storeLogin(email, password),
    onSuccess: () => {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate(ROUTES.DASHBOARD);
    },
    onError: (error: Error) => {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: ({
      email,
      password,
      firstName,
      lastName,
    }: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }) => storeRegister(email, password, firstName, lastName),
    onSuccess: () => {
      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
      });
      navigate(ROUTES.LOGIN);
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => storeLogout(),
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      navigate(ROUTES.LOGIN);
    },
  });

  // Email verification mutation
  const verifyEmailMutation = useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
    onSuccess: () => {
      toast({
        title: 'Email verified!',
        description: 'Your email has been successfully verified.',
      });
      navigate(ROUTES.LOGIN);
    },
    onError: (error: Error) => {
      toast({
        title: 'Verification failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Resend verification mutation
  const resendVerificationMutation = useMutation({
    mutationFn: (email: string) => authApi.resendVerification(email),
    onSuccess: () => {
      toast({
        title: 'Email sent',
        description: 'Verification email has been sent. Please check your inbox.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      toast({
        title: 'Email sent',
        description: 'Check your email for password reset instructions.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get user profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => authApi.getProfile(),
    enabled: isAuthenticated,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Parameters<typeof authApi.updateProfile>[0]) => authApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      useAuthStore.getState().setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    user,
    profile,
    isLoadingProfile,
    isAuthenticated,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    verifyEmail: verifyEmailMutation.mutate,
    isVerifyingEmail: verifyEmailMutation.isPending,
    resendVerification: resendVerificationMutation.mutate,
    isResendingVerification: resendVerificationMutation.isPending,
    forgotPassword: forgotPasswordMutation.mutate,
    isSendingResetEmail: forgotPasswordMutation.isPending,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
  };
}
