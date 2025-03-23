import { json, redirect, unstable_parseMultipartFormData, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Header from "~/components/Header";
import { getCampaignById } from "~/models/campaign.server";
import { getSystemHeaders, createList, createRecord } from "~/models/list.server";
import { getUser, requireUserId } from "~/utils/session.server";
import { parseCSV } from "~/utils/csv.server";
import { parseXLSX } from "~/utils/xlsx.server";

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
  
  const systemHeaders = await getSystemHeaders();
  
  return json({ user, campaign, systemHeaders });
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
  
  // Handle file upload
  const uploadHandler = async ({ name, data, filename, contentType }: any) => {
    if (name !== "files") return null;
    
    // Store the file data in memory
    const chunks = [];
    for await (const chunk of data) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    return {
      name,
      filename,
      contentType,
      buffer
    };
  };
  
  const formData = await unstable_parseMultipartFormData(request, uploadHandler);
  const files = formData.getAll("files") as any[];
  
  if (files.length === 0) {
    return json({ error: "No files uploaded" }, { status: 400 });
  }
  
  // Process each file and redirect to the mapping page for the first file
  const firstFile = files[0];
  const fileExtension = firstFile.filename.split('.').pop()?.toLowerCase();
  
  let fileData;
  if (fileExtension === 'csv') {
    const csvContent = firstFile.buffer.toString('utf-8');
    fileData = parseCSV(csvContent);
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    fileData = parseXLSX(firstFile.buffer);
  } else {
    return json({ error: "Unsupported file format" }, { status: 400 });
  }
  
  // Create a default mapping (original header -> same header)
  const defaultMapping: Record<string, string> = {};
  fileData.headers.forEach(header => {
    defaultMapping[header] = header;
  });
  
  // Create the list in the database
  const list = await createList(
    campaignId,
    userId,
    firstFile.filename,
    fileData.headers,
    defaultMapping
  );
  
  // Add all records to the database
  const recordPromises = fileData.data.map(row => {
    return createRecord(list.id, campaignId, userId, row);
  });
  
  await Promise.all(recordPromises);
  
  // Redirect back to the campaign page
  return redirect(`/campaigns/${campaignId}`);
}

export default function UploadFiles() {
  const { user, campaign } = useLoaderData<typeof loader>();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Uploading Files</h1>
            <p className="mt-2 text-sm text-gray-700">
              Processing your files for campaign: {campaign.name}
            </p>
          </div>
          
          <div className="mt-8 flex justify-center">
            <div className="inline-block animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
          
          <p className="mt-8 text-center text-gray-500">
            Please wait while we process your files...
          </p>
        </div>
      </main>
    </div>
  );
}
