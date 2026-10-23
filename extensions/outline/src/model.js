(() => {
  function normalizeDecimal(value) {
    const raw = String(value ?? "0").trim();
    if (!/^[+-]?\d+(?:\.\d+)?$/.test(raw)) {
      throw new Error("Timeline values must be plain signed decimal numbers.");
    }

    let sign = "";
    let body = raw;
    if (body.startsWith("-")) {
      sign = "-";
      body = body.slice(1);
    } else if (body.startsWith("+")) {
      body = body.slice(1);
    }

    let [whole, fraction = ""] = body.split(".");
    whole = whole.replace(/^0+(?=\d)/, "");
    fraction = fraction.replace(/0+$/, "");
    const normalized = fraction ? `${whole}.${fraction}` : whole;
    return normalized === "0" ? "0" : `${sign}${normalized}`;
  }

  function splitDecimal(value) {
    const normalized = normalizeDecimal(value);
    const negative = normalized.startsWith("-");
    const unsigned = negative ? normalized.slice(1) : normalized;
    const [whole, fraction = ""] = unsigned.split(".");
    return { normalized, negative, whole, fraction };
  }

  function compareUnsigned(a, b) {
    if (a.whole.length !== b.whole.length) return a.whole.length < b.whole.length ? -1 : 1;
    if (a.whole !== b.whole) return a.whole < b.whole ? -1 : 1;

    const length = Math.max(a.fraction.length, b.fraction.length);
    const af = a.fraction.padEnd(length, "0");
    const bf = b.fraction.padEnd(length, "0");
    if (af === bf) return 0;
    return af < bf ? -1 : 1;
  }

  function compareTimeValues(aValue, bValue) {
    const a = splitDecimal(aValue);
    const b = splitDecimal(bValue);
    if (a.negative !== b.negative) return a.negative ? -1 : 1;
    const unsigned = compareUnsigned(a, b);
    return a.negative ? -unsigned : unsigned;
  }

  function sortEvents(events) {
    return [...events].sort((a, b) => compareTimeValues(a.time?.value ?? "0", b.time?.value ?? "0"));
  }

  function formatTime(time) {
    const value = normalizeDecimal(time?.value ?? "0");
    const precision = time?.precision || "exact";
    if (precision === "rough") return `~${value}`;
    if (precision === "circa") return `c. ${value}`;
    if (precision === "range" && time?.earliest != null && time?.latest != null) {
      return `${time.earliest}–${time.latest}`;
    }
    return value;
  }

  function validateTimeline(state) {
    const problems = [];
    const eventsById = new Map(state.events.map((event) => [event.id, event]));

    for (const character of state.characters) {
      const links = state.eventCharacters.filter((link) => link.characterId === character.id);
      const linked = links
        .map((link) => ({ link, event: eventsById.get(link.eventId) }))
        .filter((entry) => entry.event);

      const birth = linked.find((entry) => entry.event.type === "birth");
      const death = linked.find((entry) => entry.event.type === "death");

      if (birth && death && compareTimeValues(birth.event.time.value, death.event.time.value) > 0) {
        problems.push({
          type: "life-order",
          characterId: character.id,
          message: `${character.name}: death occurs before birth.`
        });
      }

      for (const entry of linked) {
        if (birth && entry.event.id !== birth.event.id && compareTimeValues(entry.event.time.value, birth.event.time.value) < 0) {
          problems.push({
            type: "before-birth",
            characterId: character.id,
            eventId: entry.event.id,
            message: `${character.name} participates in “${entry.event.title}” before birth.`
          });
        }
        if (death && entry.event.id !== death.event.id && compareTimeValues(entry.event.time.value, death.event.time.value) > 0) {
          problems.push({
            type: "after-death",
            characterId: character.id,
            eventId: entry.event.id,
            message: `${character.name} participates in “${entry.event.title}” after death.`
          });
        }
      }
    }

    return problems;
  }

  globalThis.OutlineModel = {
    normalizeDecimal,
    compareTimeValues,
    sortEvents,
    formatTime,
    validateTimeline
  };
})();
