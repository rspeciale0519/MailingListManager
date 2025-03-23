import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { requireUserId } from "~/utils/session.server";
import { createCampaign } from "~/models/campaign.server";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description");

  if (typeof name !== "string" || name.length === 0) {
    return json(
      { errors: { name: "Name is required", description: null } },
      { status: 400 }
    );
  }

  if (typeof description !== "string") {
    return json(
      { errors: { name: null, description: "Description must be a string" } },
      { status: 400 }
    );
  }

  const campaign = await createCampaign(userId, name, description || null);

  return redirect(`/campaigns/${campaign.id}`);
}

export default function NewCampaignPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Create New Campaign</h1>
      
      <div className="mt-6">
        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Campaign Name
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="name"
                id="name"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="My Awesome Campaign"
                aria-invalid={actionData?.errors?.name ? true : undefined}
                aria-errormessage={
                  actionData?.errors?.name ? "name-error" : undefined
                }
              />
              {actionData?.errors?.name && (
                <div className="pt-1 text-red-700" id="name-error">
                  {actionData.errors.name}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description (optional)
            </label>
            <div className="mt-1">
              <textarea
                name="description"
                id="description"
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Campaign description..."
                aria-invalid={actionData?.errors?.description ? true : undefined}
                aria-errormessage={
                  actionData?.errors?.description ? "description-error" : undefined
                }
              />
              {actionData?.errors?.description && (
                <div className="pt-1 text-red-700" id="description-error">
                  {actionData.errors.description}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Campaign"}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
