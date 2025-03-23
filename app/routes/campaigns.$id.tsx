import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import Header from "~/components/Header";
import FileUploader from "~/components/FileUploader";
import RecordsTable from "~/components/RecordsTable";
import { getCampaignById } from "~/models/campaign.server";
import { getRecordsByCampaignId, getSystemHeaders, getListsByCampaignId } from "~/models/list.server";
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
  
  const uploadedLists = await getListsByCampaignId(campaignId);
  const records = await getRecordsByCampaignId(campaignId);
  const systemHeaders = await getSystemHeaders();
  
  // Extract all unique headers from the records
  const uniqueHeaders = new Set<string>();
  records.forEach(record => {
    Object.keys(record.data).forEach(key => uniqueHeaders.add(key));
  });
  
  return json({ 
    user, 
    campaign, 
    uploadedLists, 
    records,
    headers: Array.from(uniqueHeaders),
    systemHeaders
  });
}

export default function CampaignDetail() {
  const { user, campaign, uploadedLists, records, headers } = useLoaderData<typeof loader>();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {campaign.name}
              </h1>
              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Created on {new Date(campaign.createdAt).toLocaleDateString()}
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  {campaign.totalRecords?.toLocaleString() || 0} records
                </div>
              </div>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <Link
                to={`/campaigns/${campaign.id}/download`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Download Master List
              </Link>
              <Link
                to={`/campaigns/${campaign.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit Campaign
              </Link>
            </div>
          </div>
          
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">
                Upload Mailing Lists
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Upload CSV, XLS, or XLSX files to add to this campaign
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <FileUploader campaignId={campaign.id} />
            </div>
          </div>
          
          {uploadedLists.length > 0 && (
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">
                  Uploaded Lists
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Lists that have been uploaded to this campaign
                </p>
              </div>
              <div className="border-t border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {uploadedLists.map((list) => (
                    <li key={list.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {list.filename}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {new Date(list.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {records.length > 0 && (
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">
                  Records
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  All records in this campaign
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <RecordsTable records={records} headers={headers} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
