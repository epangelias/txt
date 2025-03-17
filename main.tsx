/// <reference lib="deno.unstable" />

import { render } from "preact-render-to-string";

const db = await Deno.openKv();
async function page(code: string) {

  const res = await db.get<string>(["content", code]);
  const content = res.value || "";

  const title = content.split("\n")[0] ?? "TXT";

  const css = await Deno.readTextFile("./style.css");
  const fun = (await import('./client.ts')).default.toString();
  const js = `(${fun})()`;

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

  console.log({ url, req });
  console.log(req.headers);
  if (req.method == "GET") {
    const html = "<!DOCTYPE html>\n" + render(await page(code));
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  } else {
    try {
      const data = await db.get<string>(["content", code]);
      const { content, lastContent } = await req.json();
      if (data.value != null && data.value != lastContent) return new Response(null, { status: 205 });
      if (!content) await db.delete(["content", code]);
      else {
        const res = await db.set(["content", code], content);
        if (!res.ok) throw new Error("Failed to save");
      }
      return new Response();
    } catch (e) {
      console.error(e);
      return Response.error();
    }
  }
}

Deno.serve(handler);