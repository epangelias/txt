

export default function (versionstamp: string | null) {
  const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
  const title = document.querySelector("title") as HTMLTitleElement;

  let lastContent = textarea.value;
  let saved = true;
  let saving = false;
  let lastSaved = Date.now();
  let lastChanged = 0;

  textarea.oninput = () => lastChanged = Date.now();

  function update() {
    saved = lastContent == textarea.value;
    const firstLine = textarea.value.split("\n")[0];
    title.textContent = (saved ? "" : "* ") + (firstLine || "TXT");

    if (Date.now() - lastSaved > 5000
      && Date.now() - lastChanged > 1000
      && !saving
      && !saved) save(textarea.value);

    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);

  async function save(content: string) {
    try {
      const body = JSON.stringify({ content, versionstamp })
      saving = true;
      const res = await fetch("", { method: "POST", body });
      if (!res.ok) throw res.statusText;
      if (res.status == 205) {
        saved = true;
        saving = false;
        return location.reload();
      }
      const data = await res.json();
      versionstamp = data.versionstamp;
      lastSaved = Date.now();
      lastContent = content;
    } catch (e) {
      console.error(e);
    }
    finally {
      lastSaved = Date.now();
      saving = false;
      update();
    }
  }

  globalThis.addEventListener("beforeunload", (event) => {
    if (!saved || saving) event.preventDefault();
  });
}