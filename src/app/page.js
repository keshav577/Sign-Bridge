import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Captions, Hand, History, Mic, Moon, Type, Heart } from "lucide-react";
import FeatureCard from "../components/FeatureCard";

const techStack = ["Next.js", "React", "JavaScript", "Tailwind CSS", "Web Speech API", "MediaPipe", "TensorFlow.js", "LocalStorage"];

// The palette, shown at the bottom of the page as a little "made with" strip
const swatches = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Grey", hex: "#D1D5DB" },
  { name: "Black", hex: "#171717" },
];

// A hand-drawn style wavy underline under the word "understood."
function Squiggle() {
  return (
    <svg viewBox="0 0 300 16" className="absolute -bottom-3 left-0 w-full text-fog" fill="none" aria-hidden="true">
      <path d="M3 9c20-9 35 7 55 0s35-9 55-1 35 8 55 0 35-8 55-1 35 8 55 1 20-4 17-2" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-fog/60 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-10 h-96 w-96 rounded-full bg-fog blur-3xl dark:bg-white/5" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-lg font-semibold text-ink/70 dark:text-fog">
              Hello, classroom <span className="inline-block origin-bottom-right animate-pulse">👋</span>
            </p>
            <h1 className="mt-3 text-5xl font-black leading-[1.05] sm:text-6xl lg:text-7xl">
              Every classroom voice,{" "}
              <span className="relative inline-block whitespace-nowrap text-ink dark:text-white">
                understood.
                <Squiggle />
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-ink/80 dark:text-fog">
              SignBridge is a classroom helper for deaf and hard-of-hearing students. It turns the teacher&apos;s speech into live captions and
              recognizes a few hand gestures through the webcam, so nobody has to miss the lesson.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/dashboard" className="btn-primary px-7 py-3 text-lg">
                Get Started <ArrowRight size={20} />
              </Link>
              <a href="#features" className="btn-secondary px-7 py-3 text-lg">
                See features
              </a>
            </div>
          </div>

          {/* Sticky-note style preview */}
          <div className="relative">
            <Image src="/logo.png" alt="SignBridge logo" width={64} height={64} priority className="absolute -left-3 -top-8 z-10 -rotate-6 rounded-2xl shadow-soft" />
            <div className="sticky-note overflow-hidden">
              <div className="flex items-center justify-between bg-ink px-6 py-4 text-white">
                <p className="text-sm font-bold uppercase tracking-wider text-fog">Live classroom captions</p>
                <span className="flex items-center gap-2 text-xs font-bold text-fog/80">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-fog" /> LIVE
                </span>
              </div>
              <div className="space-y-5 p-6">
                <div>
                  <span className="chip chip-speech">Speech</span>
                  <p className="mt-2 font-display text-2xl font-bold leading-snug">Please open your books to page twelve.</p>
                </div>
                <div>
                  <span className="chip chip-sign">Sign</span>
                  <p className="mt-2 font-display text-2xl font-bold leading-snug">Thumbs up 👍</p>
                </div>
                <p className="muted text-xs">An example of how captions look. Real captions come from your microphone and webcam.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section id="features" className="scroll-mt-16 bg-fog/30 py-20 dark:bg-ink-soft">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="eyebrow">what&apos;s inside</p>
            <h2 className="mt-2 text-4xl font-extrabold">Simple tools for an inclusive classroom</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard tilt={-0.8} icon={Mic} title="Speech-to-Text" description="Speak into the microphone and read live captions. Copy, clear or download the text." href="/speech" action="Open speech tool" />
            <FeatureCard tilt={0.6} icon={Hand} title="Sign Recognition" description="The webcam finds your hand and recognizes supported gestures. You can even train your own." href="/sign" action="Open camera tool" />
            <FeatureCard tilt={-0.5} icon={Captions} title="Live Classroom" description="Speech and sign results appear together in one caption panel with timestamps." href="/classroom" action="Start classroom" />
            <FeatureCard tilt={0.7} icon={History} title="Transcript History" description="Save transcripts in your browser, view them later or delete them." href="/history" action="View history" />
            <FeatureCard tilt={-0.6} icon={Type} title="Large, Readable Text" description="Captions use big text, and you can make them even larger with one click." />
            <FeatureCard tilt={0.5} icon={Moon} title="Light and Dark Mode" description="Switch themes for bright classrooms or dim rooms. Works on phones, tablets and laptops." />
          </div>
        </div>
      </section>

      {/* ---------- About ---------- */}
      <section id="about" className="mx-auto max-w-5xl scroll-mt-16 px-4 py-20 sm:px-6">
        <div className="panel p-8 sm:p-12">
          <div className="flex items-center gap-3">
            <Heart className="text-ink/70 dark:text-fog" size={28} />
            <h2 className="text-4xl font-extrabold">Why we made SignBridge</h2>
          </div>
          <p className="mt-5 text-lg leading-8 text-ink/80 dark:text-fog">
            In many classrooms, deaf and hard-of-hearing students miss parts of the lecture. SignBridge is a college project that asks a simple
            question: what can ordinary web technology do about it? The browser listens to the teacher and writes captions. The webcam watches for a few
            hand gestures and writes them down too. Everything runs in your browser, and transcripts stay on your own device.
          </p>
          <p className="mt-6 rounded-2xl border-l-4 border-ink dark:border-fog bg-fog/30 p-5 text-sm leading-6 text-ink dark:bg-ink dark:text-fog">
            <strong className="font-display text-base">An honest note:</strong> SignBridge recognizes a small set of hand shapes. It is not a full
            sign-language translator, because real sign languages also use movement, facial expressions and grammar.
          </p>
          <h3 className="mt-10 text-xl font-bold">Built with</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <li key={tech} className="rounded-full border-2 border-fog bg-white px-4 py-1.5 text-sm font-semibold text-ink dark:border-white/15 dark:bg-ink dark:text-fog">
                {tech}
              </li>
            ))}
          </ul>
          <Link href="/dashboard" className="btn-primary mt-9">
            Open dashboard <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="bg-ink py-10 text-center">
        <p className="font-display text-2xl font-bold text-white">Made with care for every student</p>
        <div className="mt-4 flex justify-center gap-2" aria-label="Colour palette">
          {swatches.map((s) => (
            <span key={s.hex} title={`${s.name} ${s.hex}`} className="h-6 w-6 rounded-full ring-2 ring-white/20" style={{ background: s.hex }} />
          ))}
        </div>
        <p className="mt-4 text-sm text-fog/60">SignBridge · Classroom accessibility project</p>
      </footer>
    </main>
  );
}
