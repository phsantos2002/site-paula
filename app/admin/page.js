import { isAuthenticated } from "@/lib/auth";
import { getContent, seoFor } from "@/lib/content";
import { getProperties } from "@/lib/properties";
import { getLeads } from "@/lib/leads";
import Login from "@/components/admin/Login";
import AdminForm from "@/components/admin/AdminForm";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const seo = seoFor(await getContent());
  return { title: `Administração | ${seo.fullName}`, robots: { index: false, follow: false } };
}

export default async function AdminPage() {
  const content = await getContent();
  if (!isAuthenticated()) return <Login brand={content.brand} />;
  const properties = await getProperties();
  const leads = await getLeads();
  return <AdminForm initial={content} initialProperties={properties} initialLeads={leads} />;
}
