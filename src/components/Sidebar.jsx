"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Mic, Hand, Captions, History, Home } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/speech", label: "Speech to text", icon: Mic },
  { href: "/sign", label: "Sign recognition", icon: Hand },
  { href: "/classroom", label: "Live classroom", icon: Captions },
  { href: "/history", label: "History", icon: History },
];

// Deep Navy sidebar on desktop, horizontal scrolling tabs on phones.
export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="md:sticky md:top-20 md:h-fit">
      <div className="rounded-3xl bg-ink p-2 shadow-soft ring-1 ring-white/10 md:p-4">
        <Link href="/" className="mb-3 hidden items-center gap-2 rounded-xl px-3 py-2 text-sm text-fog/70 transition hover:bg-white/5 hover:text-white md:flex">
          <Home size={17} /> Back to home
        </Link>
        <p className="hidden px-3 pb-2 text-xs font-bold uppercase tracking-wider text-fog/70 md:block">Workspace</p>
        <nav className="flex gap-1 overflow-x-auto md:block md:space-y-1 md:overflow-visible" aria-label="Workspace">
          {links.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition md:gap-3 md:py-3 ${
                  active ? "bg-white text-ink" : "text-fog/80 hover:bg-white/15 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-4 hidden rounded-2xl bg-white/5 p-3 text-xs leading-5 text-fog/70 md:block">
          Tip: use headphones in the live classroom so the mic doesn&apos;t hear spoken gestures.
        </p>
      </div>
    </aside>
  );
}
