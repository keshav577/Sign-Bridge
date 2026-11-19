import "./globals.css";
import { Fraunces, DM_Sans } from "next/font/google";
import Navbar from "../components/Navbar";

// Two friendly fonts: a warm serif for headings and a clean sans for reading.
const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata = {
  title: "SignBridge | Classroom Assistant",
  description: "Speech-to-text captions and sign gesture recognition for deaf and hard-of-hearing students.",
  icons: { icon: "/logo.png" },
};

// This tiny script runs BEFORE the page is shown, so dark mode does not flash white.
const themeScript = `
try {
  var saved = localStorage.getItem("signbridge-theme");
  var wantsDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (wantsDark) document.documentElement.classList.add("dark");
} catch (e) {}
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
