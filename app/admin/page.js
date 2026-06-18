import { isAuthenticated } from "@/lib/auth";
import { getContent } from "@/lib/content";
import { getProperties } from "@/lib/properties";
import { getLeads } from "@/lib/leads";
import Login from "@/components/admin/Login";
import AdminForm from "@/components/admin/AdminForm";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administração | Paula Regina",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!isAuthenticated()) return <Login />;
  const content = await getContent();
  const properties = await getProperties();
  const leads = await getLeads();
  return <AdminForm initial={content} initialProperties={properties} initialLeads={leads} />;
}
