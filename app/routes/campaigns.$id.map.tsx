import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import Header from "~/components/Header";
import ColumnMapper from "~/components/ColumnMapper";
import { getCampaignById } from "~/models/campaign.server";
import { createRecord, createUploadedList, getSystemHeaders, getUploadedListById } from "~/models/list.server";
import { getUser, requireUserId } from "~/utils/session.server";
import { validateRequiredFields } from "~/utils/csv.server";
import { updateCampaignTotalRecords } from "~/models/campaign.server";

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
  
  const url = new URL(request.url);
  const filename = url.searchParams.get("filename");
  const headersJson = url.searchParams.get("headers");
  const previewDataJson = url.searchParams.get("previewData");
  
  if (!filename || !headersJson || !previewDataJson) {
    return redirect(`/campaigns/${campaignId}`);
  }
  
  const headers = JSON.parse(headersJson);
  const previewData = JSON.parse(previewDataJson);
  const systemHeaders = await getSystemHeaders();
  
  // Generate a temporary file ID for the form
  const fileId = crypto.randomUUID();
  
  return json({ 
    user, 
    campaign, 
    fileId,
    filename,
    originalHeaders: headers,
    previewData,
    systemHeaders
  });
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
  const fileId = formData.get("fileId") as string;
  
  // Get the mapping data
  const mappingEntries = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("mapping["))
    .map(([key, value]) => {
      // Extract the original header from the key (e.g., "mapping[First Name]" -> "First Name")
      const originalHeader = key.match(/\[(.*?)\]/)?.[1] || "";
      return [originalHeader, value];
    });
  
  const mappings: Record<string, string> = Object.fromEntries(mappingEntries);
  
  // Get the system headers to check required fields
  const systemHeaders = await getSystemHeaders();
  const requiredSystemHeaders = systemHeaders
    .filter(header => header.isRequired)
    .map(header => header.name);
  
  // Get the file data from the URL
  const url = new URL(request.url);
  const filename = url.searchParams.get("filename");
  const previewDataJson = url.searchParams.get("previewData");
  
  if (!filename || !previewDataJson) {
    return json({ error: "Missing file data" }, { status: 400 });
  }
  
  const previewData = JSON.parse(previewDataJson);
  
  // Validate that all required fields are mapped
  const validation = validateRequiredFields(previewData, mappings, requiredSystemHeaders);
  
  if (!validation.valid) {
    return json({ 
      error: "Missing required fields", 
      missingFields: validation.missingFields 
    }, { status: 400 });
  }
  
  // Create the uploaded list record
  const originalHeaders = Object.keys(mappings);
  const uploadedList = await createUploadedList(
    campaignId,
    userId,
    filename,
    originalHeaders,
    mappings
  );
  
  // Process the preview data to create records
  for (const row of previewData) {
    await createRecord(
      uploadedList.id,
      campaignId,
      userId,
      row
    );
  }
  
  // Update the campaign's total records count
  await updateCampaignTotalRecords(campaignId, campaign.totalRecords + previewData.length);
  
  return redirect(`/campaigns/${campaignId}`);
}

export default function MapColumns() {
  const { user, campaign, fileId, filename, originalHeaders, previewData, systemHeaders } = useLoaderData<typeof loader>();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Map Columns</h1>
            <p className="mt-2 text-sm text-gray-700">
              Map columns from {filename} to system fields for campaign: {campaign.name}
            </p>
          </div>
          
          <ColumnMapper
            fileId={fileId}
            originalHeaders={originalHeaders}
            systemHeaders={systemHeaders}
            previewData={previewData}
          />
        </div>
      </main>
    </div>
  );
}
