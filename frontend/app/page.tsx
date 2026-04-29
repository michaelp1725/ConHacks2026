import { readFileSync } from "node:fs";
import { join } from "node:path";
import Script from "next/script";

function getLegacyMarkup() {
  const rawHtml = readFileSync(join(process.cwd(), "index.html"), "utf8");
  const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : rawHtml;

  return bodyContent
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/href="\.\//g, 'href="/')
    .replace(/src="\.\//g, 'src="/');
}

export default function Home() {
  const legacyMarkup = getLegacyMarkup();

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: legacyMarkup }} />
      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
