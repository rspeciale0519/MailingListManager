import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import Header from "~/components/Header";
import { requireUserId, getUser } from "~/utils/session.server";
import { getSegmentsByCampaignId } from "~/models/segment.server";
import { getCampaignsByUserId } from "~/models/campaign.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await getUser(request);
  const campaigns = await getCampaignsByUserId(userId);
  
  // Get segments for all campaigns
  let segments = [];
  for (const campaign of campaigns) {
    const campaignSegments = await getSegmentsByCampaignId(campaign.id);
    segments = [...segments, ...campaignSegments];
  }
  
  return json({ user, campaigns, segments });
}

export default function SegmentsPage() {
  const { user, campaigns, segments } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">Segments</h1>
              <p className="mt-2 text-sm text-gray-700">
                A list of all your mailing list segments across campaigns.
              </p>
            </div>
          </div>
          
          {segments.length === 0 ? (
            <div className="mt-6 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No segments</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create segments in your campaigns to filter your mailing lists.
              </p>
            </div>
          ) : (
            <div className="mt-8 flex flex-col">
              <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                          >
                            Name
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Campaign
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Conditions
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Created
                          </th>
                          <th
                            scope="col"
                            className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                          >
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {segments.map((segment) => {
                          const campaign = campaigns.find(c => c.id === segment.campaignId);
                          return (
                            <tr key={segment.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                {segment.name}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <Link
                                  to={`/campaigns/${segment.campaignId}`}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  {campaign?.name || "Unknown Campaign"}
                                </Link>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500">
                                {segment.filterConditions.length} condition(s)
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {new Date(segment.createdAt).toLocaleDateString()}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <Link
                                  to={`/campaigns/${segment.campaignId}`}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  View Campaign
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
