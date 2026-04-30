import Script from "next/script";
import { LegacyHomeMarkup } from "@/components/legacy/LegacyHomeMarkup";

export default function Home() {
  return (
    <>
      <LegacyHomeMarkup />
      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
