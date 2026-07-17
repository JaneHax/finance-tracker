import "./globals.css";
import { Inter, Instrument_Serif } from "next/font/google";

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
      <body style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
