import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/shared/ui';
import { useAuth } from '@/hooks';
import { ROUTES } from '@/constants/routes';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, isVerifyingEmail, resendVerification, isResendingVerification } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>(
    'pending'
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setVerificationStatus('error');
      setErrorMessage('No verification token provided');
      return;
    }

    // Verify email automatically on mount
    verifyEmail(token);
    setVerificationStatus('success');
  }, [searchParams, verifyEmail]);

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    if (resendEmail) {
      resendVerification(resendEmail);
    }
  };

  const handleGoToLogin = () => {
    navigate(ROUTES.LOGIN);
  };

  if (verificationStatus === 'pending' || isVerifyingEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-600" />
          <h1 className="mt-6 text-2xl font-semibold text-gray-900">Verifying your email...</h1>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we verify your email address.
          </p>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
            <h1 className="mt-6 text-3xl font-bold text-gray-900">Email Verified!</h1>
            <p className="mt-2 text-sm text-gray-600">
              Your email has been successfully verified. You can now sign in to your account.
            </p>
          </div>

          <div className="rounded-lg bg-white px-8 py-10 shadow-sm border border-gray-200">
            <Button onClick={handleGoToLogin} className="w-full">
              Go to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <XCircle className="mx-auto h-16 w-16 text-red-600" />
            <h1 className="mt-6 text-3xl font-bold text-gray-900">Verification Failed</h1>
            <p className="mt-2 text-sm text-gray-600">
              {errorMessage ||
                'We could not verify your email address. The link may be invalid or expired.'}
            </p>
          </div>

          <div className="rounded-lg bg-white px-8 py-10 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resend Verification Email</h2>
            <form onSubmit={handleResend} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isResendingVerification}>
                {isResendingVerification ? 'Sending...' : 'Resend Verification Email'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button variant="ghost" onClick={handleGoToLogin}>
                Back to Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
