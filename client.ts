

export default function () {
  const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
  const title = document.querySelector("title") as HTMLTitleElement;

  let lastContent = textarea.innerText;
  let saved = true;
  let saving = false;
  let lastSaved = Date.now();
  let lastChanged = 0;

  textarea.oninput = () => lastChanged = Date.now();

  function update() {
    saved = lastContent == textarea.innerText;
    const firstLine = textarea.value.split("\n")[0];
    title.innerText = (saved ? "" : "* ") + (firstLine || "TXT");

    if (Date.now() - lastSaved > 5000
      && Date.now() - lastChanged > 1000
      && !saving
      && !saved) save(textarea.innerText);

    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);

  async function save(content: string) {
    try {
      saving = true;
      const res = await fetch("", { method: "POST", body: content });
      if (!res.ok) throw res.statusText;
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
}