/// <reference lib="deno.unstable" />

import { render } from "preact-render-to-string";

const db = await Deno.openKv();
async function page(code: string) {

  const res = await db.get<string>(["content", code]);

  const content = res.value || "";

  const title = content.split("\n")[0] ?? "TXT";

  const css = await Deno.readTextFile("./style.css");
  const fun = (await import('./client.ts')).default.toString();
  const js = `(${fun})("${res.versionstamp}")`;

  return <html>
    <head>
      <title>{title.slice(0, 100)}</title>
      <meta charset="UTF-8" />
      <meta name="color-scheme" content="light dark" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <meta name='mobile-web-app-capable' content='yes' />
      <meta name='apple-mobile-web-app-capable' content='yes' />
      <meta name='theme-color' content="#000000" />
    </head>
    <body>
      <main style="opacity:0;pointer-effects:none;position:absolute;z-index:-999">
        <article>{content}</article>
      </main>

      <textarea placeholder="..." autocomplete="off" dangerouslySetInnerHTML={{ __html: content }}></textarea>

      <style dangerouslySetInnerHTML={{ __html: css }}></style>
      <script dangerouslySetInnerHTML={{ __html: js }}></script>
    </body>
  </html>
}

async function handler(req: Request) {
  const url = new URL(req.url);
  const code = url.pathname.slice(1);

  if (url.pathname == "/robots.txt") return new Response("User-agent: *\nAllow: /");

  if (!req.headers.get("Accept")?.includes("text/html")) {
    const res = await db.get<string>(["content", code]);
    if (res) return new Response(res.value, { headers: { "Content-Type": "text/plain" } });
    else return Response.error();
  }

  if (req.method == "GET") {
    const html = "<!DOCTYPE html>\n" + render(await page(code));
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  } else {
    try {
      const data = await db.get<string>(["content", code]);
      const { content, versionstamp } = await req.json();
      if (data.value != null && data.versionstamp !== versionstamp) {
        return new Response(null, { status: 205 });
      }
      else if (!content && data.value != null) {
        await db.delete(["content", code]);
        return new Response(null);
      }
      else {
        const res = await db.set(["content", code], content);
        if (!res.ok) throw new Error("Failed to save");
        return Response.json({ versionstamp: res.versionstamp });
      }
    } catch (e) {
      console.error(e);
      return Response.error();
    }
  }
}

Deno.serve(handler);