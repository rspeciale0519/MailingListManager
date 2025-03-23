import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { getUserId, register, createUserSession } from "~/utils/session.server";
import { getUserByEmail } from "~/models/user.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Sign Up | Mailing List Manager" },
    { name: "description", content: "Create a new Mailing List Manager account" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/campaigns");
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const redirectTo = formData.get("redirectTo") || "/campaigns";

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof confirmPassword !== "string" ||
    typeof redirectTo !== "string"
  ) {
    return json(
      { 
        errors: { 
          email: "Invalid form submission", 
          password: null,
          confirmPassword: null 
        } 
      },
      { status: 400 }
    );
  }

  if (!email) {
    return json(
      { 
        errors: { 
          email: "Email is required", 
          password: null,
          confirmPassword: null 
        } 
      },
      { status: 400 }
    );
  }

  if (!password) {
    return json(
      { 
        errors: { 
          email: null, 
          password: "Password is required",
          confirmPassword: null 
        } 
      },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return json(
      { 
        errors: { 
          email: null, 
          password: "Password must be at least 8 characters",
          confirmPassword: null 
        } 
      },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return json(
      { 
        errors: { 
          email: null, 
          password: null,
          confirmPassword: "Passwords do not match" 
        } 
      },
      { status: 400 }
    );
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return json(
      { 
        errors: { 
          email: "A user already exists with this email", 
          password: null,
          confirmPassword: null 
        } 
      },
      { status: 400 }
    );
  }

  const user = await register({ email, password });
  if (!user) {
    return json(
      { 
        errors: { 
          email: "Something went wrong creating your account", 
          password: null,
          confirmPassword: null 
        } 
      },
      { status: 500 }
    );
  }

  return createUserSession(user.id, redirectTo);
}

export default function SignUp() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/campaigns";
  const actionData = useActionData<typeof action>();
  
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create a new account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Form method="post" className="space-y-6" noValidate>
            <input type="hidden" name="redirectTo" value={redirectTo} />
            
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {actionData?.errors?.email && (
                  <p className="mt-2 text-sm text-red-600" id="email-error">
                    {actionData.errors.email}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {actionData?.errors?.password && (
                  <p className="mt-2 text-sm text-red-600" id="password-error">
                    {actionData.errors.password}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {actionData?.errors?.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600" id="confirm-password-error">
                    {actionData.errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Account
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
