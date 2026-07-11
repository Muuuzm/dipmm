import Link from "next/link";
import { AdminCatalogEditor } from "@/components/AdminCatalogEditor";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  await requireAdminSession();
  const [salon, services, masters] = await Promise.all([
    prisma.salonSettings.findUniqueOrThrow({ where: { id: 1 } }),
    prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.master.findMany({ include: { shifts: true, services: true }, orderBy: { sortOrder: "asc" } })
  ]);
  return <main className="admin-page"><header className="admin-header"><div><span className="section-badge">Каталог</span><h1>Содержание сайта</h1><p>Услуги, мастера, смены и данные студии из SQLite.</p></div><div className="admin-header-actions"><Link className="admin-top-button" href="/admin">Заявки</Link><Link className="admin-top-button" href="/">На сайт</Link><AdminLogoutButton /></div></header><AdminCatalogEditor salon={salon as unknown as Record<string, string | number | null>} services={services} masters={masters} /></main>;
}
