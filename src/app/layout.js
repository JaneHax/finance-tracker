import "./globals.css";
import { Inter, Instrument_Serif } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument",
});

export const metadata = {
  title: "Finance Tracker — Premium Money Tracker",
  description: "Premium personal money tracker. Kelola uangmu dengan elegan.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <head>
        <link rel="preconnect" href="https://www.googleapis.com" />
        <link rel="preconnect" href="https://securetoken.googleapis.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
      </head>
      <body style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
