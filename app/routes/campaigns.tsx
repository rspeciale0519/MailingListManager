import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import Header from "~/components/Header";
import { requireUserId, getUser } from "~/utils/session.server";
import { getCampaignsByUserId } from "~/models/campaign.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await getUser(request);
  const campaigns = await getCampaignsByUserId(userId);
  
  return json({ user, campaigns });
}

export default function CampaignsPage() {
  const { user, campaigns } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
