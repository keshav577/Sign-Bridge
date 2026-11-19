"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Mic, MicOff, CircleAlert } from "lucide-react";

/* =====================================================================
   SpeechToText
   Uses the browser's Web Speech API (SpeechRecognition) to turn what the
   microphone hears into text.

   Props:
     onFinalText(text)  - called every time a sentence is finished
   ===================================================================== */

const LANGUAGES = [
  { code: "en-IN", label: "English (India)" },
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "hi-IN", label: "Hindi" },
];

export default function SpeechToText({ onFinalText }) {
  const langId = useId();
  const recognitionRef = useRef(null);
  const wantListeningRef = useRef(false); // true while the user wants the mic ON
  const onFinalTextRef = useRef(onFinalText); // always holds the newest callback

  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState(""); // the sentence being spoken right now
  const [error, setError] = useState("");
  const [lang, setLang] = useState("en-IN");

  // Keep the newest callback in the ref (so we never need to recreate the recognizer)
  useEffect(() => {
    onFinalTextRef.current = onFinalText;
  });

  // Create the recognizer ONE time when the component loads
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // keep listening after a pause
    recognition.interimResults = true; // give us words while the person is still talking

    recognition.onresult = (event) => {
      // Ignore the app's own voice (spoken gestures) so it is not captioned as speech
      const spokenRecently = Date.now() - (window.signbridgeLastSpoken || 0) < 1500;
      if (window.speechSynthesis?.speaking || spokenRecently) {
        setInterim("");
        return;
      }
      let partial = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript.trim();
        if (result.isFinal) {
          if (text) onFinalTextRef.current?.(text.charAt(0).toUpperCase() + text.slice(1));
        } else {
          partial += result[0].transcript;
        }
      }
      setInterim(partial);
    };

    recognition.onerror = (event) => {
      // "no-speech" and "aborted" are normal - the browser just stopped for a moment
      if (event.error === "no-speech" || event.error === "aborted") return;
      const messages = {
        "not-allowed": "Microphone permission was denied. Click the lock icon in the address bar, allow the microphone, then press Start again.",
        "service-not-allowed": "Speech recognition is blocked in this browser. Try Google Chrome or Microsoft Edge.",
        "audio-capture": "No microphone was found. Please connect a microphone and try again.",
        network: "Cannot reach the speech service. Chrome needs an internet connection for speech recognition.",
      };
      setError(messages[event.error] || `Speech recognition error: ${event.error}`);
      wantListeningRef.current = false;
      setListening(false);
    };

    // Chrome stops by itself after some silence. If the user did not press Stop, start again.
    recognition.onend = () => {
      setInterim("");
      if (wantListeningRef.current) {
        setTimeout(() => {
          try {
            if (wantListeningRef.current) recognition.start();
          } catch {}
        }, 250);
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = recognition;

    // Clean up when the page is closed
    return () => {
      wantListeningRef.current = false;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {}
    };
  }, []);

  function start() {
    setError("");
    if (!window.isSecureContext) {
      setError("The microphone only works on https:// pages or http://localhost.");
      return;
    }
    try {
      recognitionRef.current.lang = lang;
      wantListeningRef.current = true;
      recognitionRef.current.start(); // the browser asks for microphone permission here
      setListening(true);
    } catch {
      setError("Could not start the microphone. Please wait a moment and try again.");
    }
  }

  function stop() {
    wantListeningRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {}
    setListening(false);
    setInterim("");
  }

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Speech-to-text</h2>
          <p className="muted text-sm">Turns the teacher&apos;s voice into live captions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={start} disabled={!supported || listening} className="btn-primary">
            <Mic size={17} /> Start recording
          </button>
          <button onClick={stop} disabled={!listening} className="btn-secondary">
            <MicOff size={17} /> Stop
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <label htmlFor={langId} className="muted text-sm">Language</label>
        <select
          id={langId}
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          disabled={listening}
          className="field !w-auto !py-1.5 text-sm"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </div>

      {!supported && (
        <p className="warn-box mt-4">Speech recognition is not supported in this browser. Please use the latest Google Chrome or Microsoft Edge.</p>
      )}
      {error && (
        <p role="alert" className="error-box mt-4">
          <CircleAlert size={17} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="well mt-4 p-4">
        <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink/70 dark:text-fog">
          {listening && <span className="live-dot" />}
          {listening ? "Listening now" : "Microphone is off"}
        </p>
        <p aria-live="polite" className="min-h-10 text-2xl leading-snug">
          {interim || (listening ? <span className="text-ink/70 dark:text-fog">Speak clearly...</span> : <span className="text-ink/70 dark:text-fog">Press &quot;Start recording&quot; to begin.</span>)}
        </p>
      </div>

      <p className="muted mt-3 text-xs">
        Works best in Google Chrome or Microsoft Edge. The browser may send audio to its own speech service, so an internet connection is needed.
      </p>
    </section>
  );
}
