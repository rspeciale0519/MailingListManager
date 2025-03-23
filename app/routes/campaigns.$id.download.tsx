import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { getCampaignById } from "~/models/campaign.server";
import { getRecordsByCampaignId, getUploadedListsByCampaignId } from "~/models/list.server";
import { requireUserId } from "~/utils/session.server";
import { generateCSV } from "~/utils/csv.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  const campaignId = params.id as string;
  const campaign = await getCampaignById(campaignId);
  
  if (!campaign) {
    throw new Response("Campaign not found", { status: 404 });
  }
  
  if (campaign.userId !== userId) {
    throw new Response("Not authorized", { status: 403 });
  }
  
  // Get all records for this campaign
  const records = await getRecordsByCampaignId(campaignId);
  
  if (records.length === 0) {
    throw new Response("No records found in this campaign", { status: 404 });
  }
  
  // Get the first list to use its mapped headers
  const lists = await getUploadedListsByCampaignId(campaignId);
  
  if (lists.length === 0) {
    throw new Response("No lists found in this campaign", { status: 404 });
  }
  
  const firstList = lists[0];
  
  // Generate CSV
  const csv = generateCSV(records, firstList.mappedHeaders);
  
  // Return as a downloadable file
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="campaign-${campaignId}-master.csv"`,
    },
  });
}
