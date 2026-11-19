"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Mic, Hand, Captions, FileText } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { loadHistory } from "../../components/CaptionBox";

export default function DashboardPage() {
  const [recent, setRecent] = useState([]);
  const [total, setTotal] = useState(0);

  // Read the saved transcripts from LocalStorage
  useEffect(() => {
    const all = loadHistory();
    setTotal(all.length);
    setRecent(all.slice(0, 3));
  }, []);

  return (
    <main className="app-shell">
      <Sidebar />

      <div className="min-w-0 space-y-6">
        {/* Welcome banner with the 3 main buttons */}
        <section className="relative overflow-hidden rounded-3xl bg-ink p-6 text-white shadow-soft sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <p className="relative text-sm font-bold uppercase tracking-wider text-fog">Good to see</p>
          <h1 className="relative mt-2 text-3xl font-extrabold !text-white sm:text-4xl">Welcome to SignBridge</h1>
          <p className="relative mt-2 max-w-xl text-fog/80">Make your classroom easier to follow. Pick a tool to begin.</p>
          <div className="relative mt-6 flex flex-wrap gap-3">
            <Link href="/classroom" className="inline-flex items-center gap-2 rounded-2xl bg-fog px-5 py-3 font-bold text-ink transition hover:bg-white">
              <Captions size={19} /> Start Classroom
            </Link>
            <Link href="/speech" className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-bold text-white ring-2 ring-white/25 transition hover:bg-white hover:text-ink hover:ring-white">
              <Mic size={19} /> Speech-to-Text
            </Link>
            <Link href="/sign" className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-bold text-white ring-2 ring-white/25 transition hover:bg-white hover:text-ink hover:ring-white">
              <Hand size={19} /> Sign Recognition
            </Link>
          </div>
        </section>

        {/* Recent transcripts */}
        <section className="panel p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">Recent transcripts</h2>
              <p className="muted text-sm">
                {total} saved on this device
              </p>
            </div>
            <Link href="/history" className="text-sm font-bold text-ink/70 hover:underline dark:text-fog">
              View all history →
            </Link>
          </div>

          {recent.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {recent.map((session) => (
                <li key={session.id} className="well flex items-start gap-3 p-4">
                  <FileText className="mt-0.5 shrink-0 text-ink/70 dark:text-fog" size={20} />
                  <div className="min-w-0">
                    <p className="font-semibold">{session.title}</p>
                    <p className="muted mt-0.5 text-xs">
                      {new Date(session.createdAt).toLocaleString()} · {session.items?.length || 0} entries
                    </p>
                    {session.items?.[0] && <p className="muted mt-1 truncate text-sm">&ldquo;{session.items[0].text}&rdquo;</p>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted py-10 text-center">No transcripts yet. Start a session and press Save to keep it here.</p>
          )}
        </section>
      </div>
    </main>
  );
}
