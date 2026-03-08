import "./globals.css";
import { ReactNode } from "react";
import {
  Bricolage_Grotesque,
  DM_Serif_Display,
  Fraunces,
  IBM_Plex_Mono,
  Inter_Tight,
  Manrope,
  Merriweather_Sans,
  Outfit,
  Sora,
  Source_Sans_3,
  Space_Grotesk,
  Work_Sans
} from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const sourceSans3 = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans-3" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"]
});
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-dm-serif-display",
  weight: ["400"]
});
const workSans = Work_Sans({ subsets: ["latin"], variable: "--font-work-sans" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage-grotesque" });
const merriweatherSans = Merriweather_Sans({ subsets: ["latin"], variable: "--font-merriweather-sans" });

export const metadata = {
  title: "HomeBase",
  description: "Unified LMS assignment aggregator"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const fontVariables = [
    fraunces.variable,
    sourceSans3.variable,
    spaceGrotesk.variable,
    ibmPlexMono.variable,
    sora.variable,
    manrope.variable,
    dmSerif.variable,
    workSans.variable,
    outfit.variable,
    interTight.variable,
    bricolage.variable,
    merriweatherSans.variable
  ].join(" ");

  return (
    <html lang="en" className={fontVariables}>
      <body>
        {children}
      </body>
    </html>
  );
}
