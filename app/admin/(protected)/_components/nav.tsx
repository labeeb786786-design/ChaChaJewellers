"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_NAV_LINKS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Pricing", href: "/admin/pricing" },
  { label: "FAQs", href: "/admin/faqs" },
  { label: "Settings", href: "/admin/settings" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-0.5 overflow-x-auto border-b border-admin-rule bg-admin-surface px-5">
      {ADMIN_NAV_LINKS.map((link) => {
        const isActive =
          link.href === "/admin" ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.75 text-sm font-medium ${
              isActive
                ? "border-admin-gold text-admin-ink"
                : "border-transparent text-admin-muted hover:text-admin-ink"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
