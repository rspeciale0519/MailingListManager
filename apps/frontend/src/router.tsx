import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/shared/layout/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ContactsPage } from '@/pages/contacts/ContactsPage';
import { ListsPage } from '@/pages/lists/ListsPage';
import { ImportsPage } from '@/pages/imports/ImportsPage';
import { ExportsPage } from '@/pages/exports/ExportsPage';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  // Auth routes
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: ROUTES.REGISTER,
    element: <RegisterPage />,
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: <ForgotPasswordPage />,
  },

  // Protected app routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.DASHBOARD} replace />,
      },
      {
        path: ROUTES.DASHBOARD,
        element: <DashboardPage />,
      },
      {
        path: ROUTES.CONTACTS,
        element: <ContactsPage />,
      },
      {
        path: ROUTES.LISTS,
        element: <ListsPage />,
      },
      {
        path: ROUTES.IMPORTS,
        element: <ImportsPage />,
      },
      {
        path: ROUTES.EXPORTS,
        element: <ExportsPage />,
      },
    ],
  },
]);
