import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import Header from "~/components/Header";
import { getCampaignById, deleteCampaign } from "~/models/campaign.server";
import { getUser, requireUserId } from "~/utils/session.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await getUser(request);
  
  const campaignId = params.id as string;
  const campaign = await getCampaignById(campaignId);
  
  if (!campaign) {
    throw new Response("Campaign not found", { status: 404 });
  }
  
  if (campaign.userId !== userId) {
    throw new Response("Not authorized", { status: 403 });
  }
  
  return json({ user, campaign });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  
  const campaignId = params.id as string;
  const campaign = await getCampaignById(campaignId);
  
  if (!campaign) {
    throw new Response("Campaign not found", { status: 404 });
  }
  
  if (campaign.userId !== userId) {
    throw new Response("Not authorized", { status: 403 });
  }
  
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  if (intent === "delete") {
    await deleteCampaign(campaignId);
    return redirect("/campaigns");
  }
  
  return json({ error: "Invalid action" }, { status: 400 });
}

export default function EditCampaign() {
  const { user, campaign } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Edit Campaign</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage your campaign: {campaign.name}
            </p>
          </div>
          
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">
                Campaign Details
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Basic information about your campaign
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{campaign.name}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">{new Date(campaign.createdAt).toLocaleDateString()}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Total Records</dt>
                  <dd className="mt-1 text-sm text-gray-900">{campaign.totalRecords.toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          </div>
          
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">
                Danger Zone
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Destructive actions for this campaign
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="bg-red-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Delete Campaign</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        This action cannot be undone. This will permanently delete the campaign and all associated data.
                      </p>
                    </div>
                    <div className="mt-4">
                      <Form method="post">
                        <input type="hidden" name="intent" value="delete" />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                        >
                          Delete Campaign
                        </button>
                      </Form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
