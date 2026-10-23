(() => {
  const ROOT_ID = "outline-extension-root";
  let root = null;
  let open = false;
  let activeView = "research";

  const html = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const parseTags = (value) => String(value || "")
    .split(/[,\s]+/)
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);

  function ensureRoot() {
    if (root && document.documentElement.contains(root)) return root;
    root = document.createElement("aside");
    root.id = ROOT_ID;
    root.setAttribute("aria-label", "Outline sidebar");
    document.documentElement.appendChild(root);
    return root;
  }

  async function setOpen(next) {
    ensureRoot();
    open = next;
    root.classList.toggle("outline-open", open);
    await OutlineStorage.setUi({ sidebarOpen: open });
    if (open) await render();
  }

  async function setView(view) {
    activeView = view;
    await OutlineStorage.setUi({ activeView: view });
    await render();
  }

  function compactPageText() {
    const text = document.body?.innerText || "";
    return text
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 120000);
  }

  async function clipSelection(selectionText) {
    const text = selectionText || window.getSelection()?.toString() || "";
    if (!text.trim()) return;
    await OutlineStorage.addClip({
      title: document.title || location.hostname,
      sourceTitle: document.title || "",
      text: text.trim(),
      url: location.href,
      kind: "selection"
    });
    activeView = "research";
    await setOpen(true);
  }

  async function clipPage() {
    await OutlineStorage.addClip({
      title: document.title || location.hostname,
      sourceTitle: document.title || "",
      text: compactPageText(),
      url: location.href,
      kind: "page"
    });
    activeView = "research";
    await setOpen(true);
  }

  function tabs() {
    const items = [
      ["research", "Research"],
      ["notes", "Notes"],
      ["timeline", "Timeline"],
      ["characters", "People"]
    ];
    return `<nav class="outline-tabs">${items.map(([value, label]) => `
      <button class="outline-tab" data-view="${value}" aria-selected="${activeView === value}">${label}</button>
    `).join("")}</nav>`;
  }

  function renderResearch(state) {
    const cards = state.clips.length ? state.clips.map((clip) => `
      <article class="outline-card">
        <div class="outline-card-title">${html(clip.title)}</div>
        <div class="outline-card-meta">${html(clip.kind)} · ${new Date(clip.capturedAt).toLocaleString()}</div>
        <div class="outline-card-text">${html(clip.text)}</div>
        ${clip.url ? `<a class="outline-link" href="${html(clip.url)}" target="_blank" rel="noreferrer">Open source</a>` : ""}
        <div><button class="outline-delete" data-delete-collection="clips" data-delete-id="${html(clip.id)}">Delete</button></div>
      </article>
    `).join("") : `<div class="outline-empty">No research clips yet.</div>`;

    return `
      <section class="outline-section outline-stack">
        <h3>Capture</h3>
        <button class="outline-button outline-button-primary" id="outline-clip-selection">Clip current selection</button>
        <button class="outline-button" id="outline-clip-page">Save readable page text</button>
        <div class="outline-muted">Right-click selected text on any page for the same capture workflow.</div>
      </section>
      <section class="outline-section">
        <h3>Research (${state.clips.length})</h3>
        ${cards}
      </section>`;
  }

  function renderNotes(state) {
    const notes = state.notes.length ? state.notes.map((note) => `
      <article class="outline-card">
        <div class="outline-card-title">${html(note.title)}</div>
        <div class="outline-card-text">${html(note.body)}</div>
        <div>${(note.tags || []).map((tag) => `<span class="outline-badge">#${html(tag)}</span>`).join("")}</div>
        <button class="outline-delete" data-delete-collection="notes" data-delete-id="${html(note.id)}">Delete</button>
      </article>
    `).join("") : `<div class="outline-empty">No notes yet.</div>`;

    return `
      <section class="outline-section outline-stack">
        <h3>New note</h3>
        <input class="outline-input" id="outline-note-title" placeholder="Title">
        <textarea class="outline-textarea" id="outline-note-body" placeholder="Idea, scene note, fact, question…"></textarea>
        <input class="outline-input" id="outline-note-tags" placeholder="tags, chapter3, protagonist">
        <button class="outline-button outline-button-primary" id="outline-save-note">Save note</button>
      </section>
      <section class="outline-section"><h3>Notes (${state.notes.length})</h3>${notes}</section>`;
  }

  function renderTimeline(state) {
    const ordered = OutlineModel.sortEvents(state.events);
    const events = ordered.length ? ordered.map((event) => `
      <article class="outline-card">
        <div class="outline-row">
          <strong>${html(OutlineModel.formatTime(event.time))}</strong>
          <span>${html(event.title)}</span>
        </div>
        <div class="outline-card-meta">${html(event.type)}</div>
        <button class="outline-delete" data-delete-collection="events" data-delete-id="${html(event.id)}">Delete</button>
      </article>
    `).join("") : `<div class="outline-empty">No timeline events yet.</div>`;

    const warnings = OutlineModel.validateTimeline(state);
    return `
      <section class="outline-section outline-stack">
        <h3>New timeline event</h3>
        <input class="outline-input" id="outline-event-title" placeholder="Event title">
        <div class="outline-row">
          <input class="outline-input" id="outline-event-time" placeholder="13800000000 or -50.5">
          <select class="outline-select" id="outline-event-precision">
            <option value="exact">Exact</option>
            <option value="rough">Rough</option>
            <option value="circa">Circa</option>
          </select>
        </div>
        <select class="outline-select" id="outline-event-type">
          <option value="event">Event</option>
          <option value="birth">Birth</option>
          <option value="death">Death</option>
          <option value="battle">Battle</option>
          <option value="discovery">Discovery</option>
        </select>
        <button class="outline-button outline-button-primary" id="outline-save-event">Add event</button>
        <div class="outline-muted">Timeline values are stored as decimal strings so very large fictional epochs do not depend on JavaScript floating-point precision.</div>
      </section>
      ${warnings.length ? `<section class="outline-section"><h3>Continuity warnings</h3>${warnings.map((problem) => `<div class="outline-card">⚠ ${html(problem.message)}</div>`).join("")}</section>` : ""}
      <section class="outline-section"><h3>Chronology (${state.events.length})</h3>${events}</section>`;
  }

  function renderCharacters(state) {
    const characters = state.characters.length ? state.characters.map((character) => `
      <article class="outline-card">
        <div class="outline-card-title">${html(character.name)}</div>
        <div class="outline-card-meta">Status: ${html(character.status)}</div>
        <button class="outline-delete" data-delete-collection="characters" data-delete-id="${html(character.id)}">Delete</button>
      </article>
    `).join("") : `<div class="outline-empty">No characters yet.</div>`;

    return `
      <section class="outline-section outline-stack">
        <h3>New character</h3>
        <input class="outline-input" id="outline-character-name" placeholder="Name">
        <select class="outline-select" id="outline-character-status">
          <option value="unknown">Unknown</option>
          <option value="alive">Alive</option>
          <option value="dead">Dead</option>
          <option value="missing">Missing</option>
        </select>
        <button class="outline-button outline-button-primary" id="outline-save-character">Add character</button>
      </section>
      <section class="outline-section"><h3>Characters (${state.characters.length})</h3>${characters}</section>`;
  }

  async function exportState() {
    const state = await OutlineStorage.read();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `outline-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function render() {
    ensureRoot();
    const state = await OutlineStorage.read();
    activeView = activeView || state.ui?.activeView || "research";
    const body = activeView === "notes" ? renderNotes(state)
      : activeView === "timeline" ? renderTimeline(state)
      : activeView === "characters" ? renderCharacters(state)
      : renderResearch(state);

    root.innerHTML = `
      <div class="outline-shell">
        <header class="outline-header">
          <div class="outline-title">Outline</div>
          <button class="outline-icon-button" id="outline-export" title="Export JSON">⇩</button>
          <button class="outline-icon-button" id="outline-close" title="Close">×</button>
        </header>
        ${tabs()}
        <main class="outline-body">${body}</main>
        <footer class="outline-footer">
          <span class="outline-muted">v0.1 framework</span>
          <span class="outline-muted">Local storage</span>
        </footer>
      </div>`;

    wireEvents();
  }

  function wireEvents() {
    root.querySelector("#outline-close")?.addEventListener("click", () => setOpen(false));
    root.querySelector("#outline-export")?.addEventListener("click", exportState);
    root.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.view));
    });

    root.querySelector("#outline-clip-selection")?.addEventListener("click", () => clipSelection());
    root.querySelector("#outline-clip-page")?.addEventListener("click", clipPage);

    root.querySelector("#outline-save-note")?.addEventListener("click", async () => {
      await OutlineStorage.addNote({
        title: root.querySelector("#outline-note-title")?.value,
        body: root.querySelector("#outline-note-body")?.value,
        tags: parseTags(root.querySelector("#outline-note-tags")?.value)
      });
      await render();
    });

    root.querySelector("#outline-save-character")?.addEventListener("click", async () => {
      const name = root.querySelector("#outline-character-name")?.value?.trim();
      if (!name) return;
      await OutlineStorage.addCharacter({
        name,
        status: root.querySelector("#outline-character-status")?.value
      });
      await render();
    });

    root.querySelector("#outline-save-event")?.addEventListener("click", async () => {
      const title = root.querySelector("#outline-event-title")?.value?.trim();
      const rawTime = root.querySelector("#outline-event-time")?.value?.trim();
      if (!title || !rawTime) return;
      try {
        const value = OutlineModel.normalizeDecimal(rawTime);
        await OutlineStorage.addEvent({
          title,
          type: root.querySelector("#outline-event-type")?.value,
          time: {
            value,
            precision: root.querySelector("#outline-event-precision")?.value
          }
        });
        await render();
      } catch (error) {
        alert(error.message);
      }
    });

    root.querySelectorAll("[data-delete-collection]").forEach((button) => {
      button.addEventListener("click", async () => {
        await OutlineStorage.remove(button.dataset.deleteCollection, button.dataset.deleteId);
        await render();
      });
    });
  }

  async function handleMessage(message) {
    if (message.type === "outline:toggle") return setOpen(!open);
    if (message.type === "outline:clip-selection") return clipSelection(message.selectionText);
    if (message.type === "outline:clip-page") return clipPage();
    if (message.type === "outline:new-note") {
      activeView = "notes";
      return setOpen(true);
    }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    Promise.resolve(handleMessage(message))
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  });

  OutlineStorage.ensure().then(async () => {
    const state = await OutlineStorage.read();
    activeView = state.ui?.activeView || "research";
    ensureRoot();
  });
})();
