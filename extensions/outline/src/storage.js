(() => {
  const STORAGE_KEY = "outlineStateV1";

  const id = (prefix) => {
    const value = globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    return `${prefix}_${value}`;
  };

  const defaults = () => ({
    version: 1,
    activeProjectId: null,
    projects: [],
    clips: [],
    notes: [],
    characters: [],
    locations: [],
    events: [],
    eventCharacters: [],
    eventLocations: [],
    ui: {
      activeView: "research",
      sidebarOpen: false
    }
  });

  async function read() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || defaults();
  }

  async function write(state) {
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
    return state;
  }

  async function ensure() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    if (!result[STORAGE_KEY]) await write(defaults());
  }

  async function update(mutator) {
    const state = await read();
    const replacement = await mutator(state);
    return write(replacement || state);
  }

  async function addClip(input) {
    let created;
    await update((state) => {
      created = {
        id: id("clip"),
        title: input.title || "Untitled research",
        text: input.text || "",
        url: input.url || "",
        sourceTitle: input.sourceTitle || input.title || "",
        tags: input.tags || [],
        capturedAt: new Date().toISOString(),
        kind: input.kind || "selection"
      };
      state.clips.unshift(created);
    });
    return created;
  }

  async function addNote(input) {
    let created;
    await update((state) => {
      created = {
        id: id("note"),
        title: input.title || "Untitled note",
        body: input.body || "",
        tags: input.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      state.notes.unshift(created);
    });
    return created;
  }

  async function addCharacter(input) {
    let created;
    await update((state) => {
      created = {
        id: id("character"),
        name: input.name || "Unnamed character",
        status: input.status || "unknown",
        metadata: input.metadata || {},
        createdAt: new Date().toISOString()
      };
      state.characters.push(created);
    });
    return created;
  }

  async function addEvent(input) {
    let created;
    await update((state) => {
      created = {
        id: id("event"),
        title: input.title || "Untitled event",
        description: input.description || "",
        type: input.type || "event",
        time: {
          value: input.time?.value ?? "0",
          precision: input.time?.precision || "exact",
          earliest: input.time?.earliest ?? null,
          latest: input.time?.latest ?? null,
          calendarId: input.time?.calendarId ?? null
        },
        createdAt: new Date().toISOString()
      };
      state.events.push(created);
    });
    return created;
  }

  async function remove(collection, itemId) {
    const allowed = new Set(["clips", "notes", "characters", "locations", "events"]);
    if (!allowed.has(collection)) throw new Error(`Unsupported collection: ${collection}`);
    return update((state) => {
      state[collection] = state[collection].filter((item) => item.id !== itemId);
    });
  }

  async function setUi(values) {
    return update((state) => {
      state.ui = { ...state.ui, ...values };
    });
  }

  globalThis.OutlineStorage = {
    STORAGE_KEY,
    defaults,
    ensure,
    read,
    write,
    update,
    addClip,
    addNote,
    addCharacter,
    addEvent,
    remove,
    setUi
  };
})();
