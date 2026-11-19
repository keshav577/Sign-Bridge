"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Trash2, Eye, EyeOff, Download } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { CaptionItem, deleteTranscript, downloadTextFile, loadHistory, transcriptToText } from "../../components/CaptionBox";

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [openId, setOpenId] = useState(null); // which transcript is expanded
  const [loaded, setLoaded] = useState(false);

  // Read saved transcripts when the page opens
  useEffect(() => {
    setSessions(loadHistory());
    setLoaded(true);
  }, []);

  function handleDelete(session) {
    if (!window.confirm(`Delete "${session.title}"? This cannot be undone.`)) return;
    setSessions(deleteTranscript(session.id));
    if (openId === session.id) setOpenId(null);
  }

  return (
    <main className="app-shell">
      <Sidebar />
      <div className="min-w-0">
        <p className="eyebrow">Saved work</p>
        <h1 className="mt-1 text-3xl font-extrabold">Transcript history</h1>
        <p className="muted mt-2">Transcripts are stored in this browser only. Clearing your browser data will remove them.</p>

        <div className="mt-6 space-y-4">
          {sessions.map((session) => {
            const open = openId === session.id;
            const speechCount = session.items?.filter((i) => i.source === "Speech").length || 0;
            const signCount = session.items?.filter((i) => i.source === "Sign").length || 0;
            return (
              <article key={session.id} className="panel p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-bold">{session.title}</h2>
                    <p className="muted mt-1 text-sm">
                      {new Date(session.createdAt).toLocaleString()} · {speechCount} speech · {signCount} sign
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setOpenId(open ? null : session.id)} aria-expanded={open} className="btn-secondary btn-sm">
                      {open ? <EyeOff size={15} /> : <Eye size={15} />} {open ? "Hide" : "View"}
                    </button>
                    <button onClick={() => downloadTextFile(transcriptToText(session.items || []))} className="btn-secondary btn-sm">
                      <Download size={15} /> Download
                    </button>
                    <button onClick={() => handleDelete(session)} className="btn-secondary btn-sm !text-red-700 dark:!text-red-300">
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="well mt-4 max-h-96 space-y-3 overflow-y-auto p-4">
                    {session.items?.length ? session.items.map((item) => <CaptionItem key={item.id} item={item} />) : <p className="muted">This transcript is empty.</p>}
                  </div>
                )}
              </article>
            );
          })}

          {loaded && sessions.length === 0 && (
            <div className="panel p-12 text-center">
              <p className="text-lg font-semibold">No transcripts saved yet</p>
              <p className="muted mt-2 text-sm">Create captions in the Live classroom, Speech or Sign page and press Save.</p>
              <Link href="/classroom" className="btn-primary mt-6">
                Go to Live classroom
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
