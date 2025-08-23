/**
 * Quick Notes – Expressive Writer (Integrated + Fixes)
 * - Expressive fonts, moods, palettes, bullets
 * - Bold/Italic, lists, quote, checklist
 * - Text/vertical alignment, orientation
 * - PNG/PDF export
 * - Immutable title, localStorage, large canvas
 * - FIXES: color apply, vertical align, rotated, single-item checklist, wrapping
 */
(() => {
  "use strict";

  /** @typedef {{ fontFamily:string, fontSize:number, fg:string, mood:string, bullets:string, valign:string, orientation:string }} NoteStyle */
  /** @typedef {{ html:string, style:NoteStyle }} NoteContent */
  /** @typedef {{ id:string, title:string, content:NoteContent, createdAt:number, updatedAt:number }} Note */

  /* ---------- DOM ---------- */
  const STORAGE_KEY = "quickNotes";
  const form = /** @type {HTMLFormElement} */ (
    document.getElementById("notes-form")
  );
  const title = /** @type {HTMLInputElement} */ (
    document.getElementById("note-title")
  );
  const stack = /** @type {HTMLElement} */ (
    document.getElementById("notes-container")
  );

  /* ---------- Fonts ---------- */
  const FONTS = [
    {
      label: "Victorian (Cinzel Decorative)",
      family: '"Cinzel Decorative", serif',
    },
    { label: "Victorian Serif (Cinzel)", family: "Cinzel, serif" },
    {
      label: "Elegant Serif (Cormorant)",
      family: '"Cormorant Garamond", serif',
    },
    { label: "Handwritten (Great Vibes)", family: '"Great Vibes", cursive' },
    {
      label: "Handwritten (Dancing Script)",
      family: '"Dancing Script", cursive',
    },
    {
      label: "Typewriter (Special Elite)",
      family: '"Special Elite", monospace',
    },
    {
      label: "Typewriter (Courier Prime)",
      family: '"Courier Prime", monospace',
    },
    { label: "Classic (Merriweather)", family: "Merriweather, serif" },
    { label: "Classic (Lora)", family: "Lora, serif" },
    { label: "Modern (Poppins)", family: "Poppins, system-ui, sans-serif" },
    { label: "Modern (Raleway)", family: "Raleway, system-ui, sans-serif" },
  ];

  /* ---------- Background moods ---------- */
  const MOODS = [
    { label: "⬜ Clean", class: "bg-clean" },
    { label: "☀️ Sunrise", class: "bg-sunrise" },
    { label: "🎨 Watercolor", class: "bg-watercolor" },
    { label: "🎉 Confetti", class: "bg-confetti" },
    { label: "🌇 Sunset Rush", class: "bg-sunset-rush" },
    { label: "🌤 Pastel Sky", class: "bg-pastel-sky" },
    { label: "🌊 Ocean", class: "bg-ocean" },
    { label: "☕ Cozy Beige", class: "bg-cozy-beige" },
    { label: "☁️ Cloud Notes", class: "bg-cloud-notes" },
    { label: "🌧 Rain", class: "bg-rain" },
    { label: "📜 Old Paper", class: "bg-old-paper" },
    { label: "🎞 Faded Film", class: "bg-faded-film" },
    { label: "🧨 Grunge", class: "bg-grunge" },
    { label: "🔥 Fire", class: "bg-fire" },
    { label: "🧱 Cracked Wall", class: "bg-cracked-wall" },
    { label: "🪵 Wood", class: "bg-wood" },
    { label: "🍃 Leaf", class: "bg-leaf" },
    { label: "🪨 Stone", class: "bg-stone" },
    { label: "🌌 Galaxy", class: "bg-galaxy" },
    { label: "🪩 Holographic", class: "bg-holo" },
    { label: "💨 Smoke", class: "bg-smoke" },
    { label: "🏛 Marble", class: "bg-marble" },
    { label: "🧭 Deep Blue", class: "bg-deep-blue" },
    { label: "▦ Minimal Grid", class: "bg-minimal-grid" },
  ];

  /* ---------- Color palettes ---------- */
  const PALETTES = [
    { group: "Essentials", colors: ["#000000", "#ffffff"] },
    {
      group: "Pastels",
      colors: [
        "#ffd6e7",
        "#e3f2fd",
        "#e6fffb",
        "#fff3cd",
        "#e8f5e9",
        "#ede7f6",
        "#fce4ec",
      ],
    },
    {
      group: "Brights",
      colors: [
        "#ffbe0b",
        "#fb5607",
        "#ff006e",
        "#8338ec",
        "#3a86ff",
        "#00b894",
        "#00d1b2",
      ],
    },
    {
      group: "Earthy",
      colors: [
        "#7f5539",
        "#a68a64",
        "#6b705c",
        "#3a5a40",
        "#b5651d",
        "#8d5524",
      ],
    },
    {
      group: "Darks",
      colors: [
        "#1b263b",
        "#2e294e",
        "#4a4a4a",
        "#3c0d0d",
        "#111827",
        "#0b0f1a",
      ],
    },
  ];

  /* ---------- Bullet styles ---------- */
  const BULLETS = [
    { label: "★ Stars", key: "star" },
    { label: "◆ Diamonds", key: "diam" },
    { label: "❧ Leaves", key: "leaf" },
    { label: "➤ Arrows", key: "arrow" },
    { label: "– Dashes", key: "dash" },
  ];

  /* ---------- Storage helpers ---------- */
  const load = () => {
    try {
      return /** @type {Note[]} */ (
        JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
      );
    } catch {
      return [];
    }
  };
  const save = (notes) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  const uid = () =>
    crypto?.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const esc = (s = "") =>
    s.replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m])
    );

  function makeNote(t) {
    /** @type {NoteStyle} */
    const style = {
      fontFamily: FONTS[0].family,
      fontSize: 20,
      fg: "#1b263b",
      mood: "bg-clean",
      bullets: "star",
      valign: "va-top",
      orientation: "orient-horizontal",
    };
    return {
      id: uid(),
      title: t.trim(),
      content: { html: "<p><br></p>", style },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  function mutate(id, fn) {
    const notes = load();
    const i = notes.findIndex((n) => n.id === id);
    if (i === -1) return null;
    fn(notes[i]);
    notes[i].updatedAt = Date.now();
    save(notes);
    return notes[i];
  }

  /* ---------- Export helpers ---------- */
  async function exportAsPNG(noteId, cardEl) {
    const body = cardEl.querySelector(".note-body");
    if (!body || !window.html2canvas) return;
    const canvas = await html2canvas(body, {
      useCORS: true,
      backgroundColor: null,
      scale: 2,
    });
    const a = document.createElement("a");
    a.download = `note-${noteId}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }
  async function exportAsPDF(noteId, cardEl) {
    const body = cardEl.querySelector(".note-body");
    if (!body || !window.jspdf?.jsPDF || !window.html2canvas) return;
    const canvas = await html2canvas(body, {
      useCORS: true,
      backgroundColor: "#ffffff",
      scale: 2,
    });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const img = canvas.toDataURL("image/png");
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = canvas.width / canvas.height;
    let w = pageW,
      h = w / ratio;
    if (h > pageH) {
      h = pageH;
      w = h * ratio;
    }
    const x = (pageW - w) / 2,
      y = (pageH - h) / 2;
    pdf.addImage(img, "PNG", x, y, w, h);
    pdf.save(`note-${noteId}.pdf`);
  }

  /* ---------- Rendering ---------- */
  function renderAll() {
    stack.innerHTML = "";
    load().forEach((n) => stack.append(renderCard(n)));
  }

  function renderCard(note) {
    const card = document.createElement("article");
    card.className = "note-card";
    card.dataset.id = note.id;

    card.innerHTML = `
      <div class="note-header">
        <h3 class="note-title">${esc(note.title)}</h3>
        <div class="note-actions">
          <button class="note-btn export-png"  title="Export as PNG"><i class="fa-solid fa-image"></i></button>
          <button class="note-btn export-pdf"  title="Export as PDF"><i class="fa-solid fa-file-pdf"></i></button>
          <button class="note-btn delete"      title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>

      <div class="note-toolbar">
        <!-- Fonts + size -->
        <div class="tb-group">
          <label class="tb-label" title="Font style"><i class="fa-solid fa-feather"></i></label>
          <select class="ctl-font" aria-label="Font family"></select>
          <label class="tb-label" title="Font size"><i class="fa-solid fa-text-height"></i></label>
          <select class="ctl-size size-select" aria-label="Font size">
            ${[16, 18, 20, 22, 24, 28, 32, 36]
              .map((px) => `<option value="${px}">${px}px</option>`)
              .join("")}
          </select>
        </div>

        <span class="tb-sep"></span>

        <!-- Color palette -->
        <div class="tb-group">
          <label class="tb-label" title="Text color"><i class="fa-solid fa-palette"></i></label>
          <div class="palette">
            ${PALETTES.map(
              (p) => `
              <span class="group-label">${p.group}</span>
              ${p.colors
                .map(
                  (c) =>
                    `<span class="swatch ${
                      c === "#ffffff" ? "is-white" : ""
                    }" data-color="${c}" style="background:${c}"></span>`
                )
                .join("")}
            `
            ).join("")}
            <input type="color" class="ctl-color-custom" title="Custom color">
          </div>
        </div>

        <span class="tb-sep"></span>

        <!-- Lists + bullets -->
        <div class="tb-group">
          <button type="button" class="tb-btn ctl-ul" title="Bulleted list"><i class="fa-solid fa-list-ul"></i></button>
          <button type="button" class="tb-btn ctl-ol" title="Numbered list"><i class="fa-solid fa-list-ol"></i></button>
          <select class="ctl-bullets" aria-label="Bullet style">
            ${BULLETS.map(
              (b) => `<option value="${b.key}">${b.label}</option>`
            ).join("")}
          </select>
        </div>

        <span class="tb-sep"></span>

        <!-- Background -->
        <div class="tb-group">
          <label class="tb-label" title="Background"><i class="fa-solid fa-image"></i></label>
          <select class="ctl-mood" aria-label="Background mood">
            ${MOODS.map(
              (m) => `<option value="${m.class}">${m.label}</option>`
            ).join("")}
          </select>
        </div>

        <span class="tb-sep"></span>

        <!-- Alignment -->
        <div class="tb-group">
          <button type="button" class="tb-btn align-left"    title="Align left"><i class="fa-solid fa-align-left"></i></button>
          <button type="button" class="tb-btn align-center"  title="Align center"><i class="fa-solid fa-align-center"></i></button>
          <button type="button" class="tb-btn align-right"   title="Align right"><i class="fa-solid fa-align-right"></i></button>
          <button type="button" class="tb-btn align-justify" title="Justify"><i class="fa-solid fa-align-justify"></i></button>
        </div>

        <!-- Vertical align -->
        <div class="tb-group">
          <label class="tb-label" title="Vertical align"><i class="fa-solid fa-arrows-up-to-line"></i></label>
          <select class="ctl-valign" aria-label="Vertical align">
            <option value="va-top">Top</option>
            <option value="va-middle">Middle</option>
            <option value="va-bottom">Bottom</option>
          </select>
        </div>

        <!-- Orientation -->
        <div class="tb-group">
          <label class="tb-label" title="Text orientation"><i class="fa-solid fa-arrows-up-down"></i></label>
          <select class="ctl-orient" aria-label="Text orientation">
            <option value="orient-horizontal">Horizontal</option>
            <option value="orient-vertical">Vertical</option>
            <option value="orient-rotated">Rotated</option>
          </select>
        </div>

        <span class="tb-sep"></span>

        <!-- Emphasis + presets -->
        <div class="tb-group">
          <button type="button" class="tb-btn ctl-bold"    title="Bold"><i class="fa-solid fa-bold"></i></button>
          <button type="button" class="tb-btn ctl-italic"  title="Italic"><i class="fa-solid fa-italic"></i></button>
          <button type="button" class="tb-btn preset-quote" title="Quote block"><i class="fa-solid fa-quote-right"></i></button>
          <button type="button" class="tb-btn preset-check" title="Checklist"><i class="fa-solid fa-square-check"></i></button>
        </div>
      </div>

      <div class="note-body ${note.content.style.mood} ${
      note.content.style.valign
    } ${note.content.style.orientation} rt-bullets-${
      note.content.style.bullets
    }">
        <div class="rich-text" contenteditable="true"
          style="font-family:${note.content.style.fontFamily}; font-size:${
      note.content.style.fontSize
    }px; color:${note.content.style.fg};">
          ${note.content.html}
        </div>
      </div>
    `;

    /* Nodes */
    const fontSel = /** @type {HTMLSelectElement} */ (
      card.querySelector(".ctl-font")
    );
    const sizeSel = /** @type {HTMLSelectElement} */ (
      card.querySelector(".ctl-size")
    );
    const moodSel = /** @type {HTMLSelectElement} */ (
      card.querySelector(".ctl-mood")
    );
    const bulletsSel = /** @type {HTMLSelectElement} */ (
      card.querySelector(".ctl-bullets")
    );
    const valignSel = /** @type {HTMLSelectElement} */ (
      card.querySelector(".ctl-valign")
    );
    const orientSel = /** @type {HTMLSelectElement} */ (
      card.querySelector(".ctl-orient")
    );
    const editor = /** @type {HTMLElement} */ (
      card.querySelector(".rich-text")
    );
    const body = /** @type {HTMLElement} */ (card.querySelector(".note-body"));
    const noteId = note.id;

    /* Populate fonts */
    FONTS.forEach((f) => {
      const o = document.createElement("option");
      o.value = f.family;
      o.textContent = f.label;
      fontSel.append(o);
    });

    /* Set initial control values */
    fontSel.value = note.content.style.fontFamily;
    sizeSel.value = String(note.content.style.fontSize);
    moodSel.value = note.content.style.mood;
    bulletsSel.value = note.content.style.bullets;
    valignSel.value = note.content.style.valign;
    orientSel.value = note.content.style.orientation;

    /* Debounced persistence */
    let t;
    editor.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(
        () =>
          mutate(noteId, (n) => {
            n.content.html = editor.innerHTML;
          }),
        160
      );
    });

    /* Font family / size */
    fontSel.addEventListener("change", (e) => {
      const family = /** @type {HTMLSelectElement} */ (e.target).value;
      editor.style.fontFamily = family;
      mutate(noteId, (n) => {
        n.content.style.fontFamily = family;
      });
    });
    sizeSel.addEventListener("change", (e) => {
      const px = Number(/** @type {HTMLSelectElement} */ (e.target).value);
      editor.style.fontSize = `${px}px`;
      mutate(noteId, (n) => {
        n.content.style.fontSize = px;
      });
    });

    /* ---- Color application (FIX) ---- */
    function applyColor(color) {
      // Always update base color so new text matches immediately
      editor.style.color = color;

      // If user has a selection inside this editor, apply to selection too
      const sel = window.getSelection();
      if (sel && sel.rangeCount && editor.contains(sel.anchorNode)) {
        editor.focus();
        document.execCommand("foreColor", false, color);
      }
      mutate(noteId, (n) => {
        n.content.style.fg = color;
        n.content.html = editor.innerHTML;
      });
    }
    card.querySelectorAll(".swatch").forEach((el) => {
      el.addEventListener("click", (ev) => {
        const color =
          ev.currentTarget instanceof HTMLElement
            ? ev.currentTarget.dataset.color
            : undefined;
        if (!color) return;
        applyColor(color);
      });
    });
    const custom = /** @type {HTMLInputElement} */ (
      card.querySelector(".ctl-color-custom")
    );
    custom.addEventListener("input", (e) => {
      const c = /** @type {HTMLInputElement} */ (e.target).value;
      applyColor(c);
    });

    /* Lists + bullets */
    card.querySelector(".ctl-ul")?.addEventListener("click", () => {
      editor.focus();
      document.execCommand("insertUnorderedList");
      mutate(noteId, (n) => {
        n.content.html = editor.innerHTML;
      });
    });
    card.querySelector(".ctl-ol")?.addEventListener("click", () => {
      editor.focus();
      document.execCommand("insertOrderedList");
      mutate(noteId, (n) => {
        n.content.html = editor.innerHTML;
      });
    });
    bulletsSel.addEventListener("change", (e) => {
      const key = /** @type {HTMLSelectElement} */ (e.target).value;
      body.classList.remove(
        ...Array.from(body.classList).filter((c) => c.startsWith("rt-bullets-"))
      );
      body.classList.add(`rt-bullets-${key}`);
      mutate(noteId, (n) => {
        n.content.style.bullets = key;
      });
    });

    /* Background */
    moodSel.addEventListener("change", (e) => {
      const cls = /** @type {HTMLSelectElement} */ (e.target).value;
      const bulletsClass =
        Array.from(body.classList).find((c) => c.startsWith("rt-bullets-")) ||
        "";
      body.className =
        `note-body ${cls} ${valignSel.value} ${orientSel.value} ${bulletsClass}`.trim();
      mutate(noteId, (n) => {
        n.content.style.mood = cls;
      });
    });

    /* Bold / Italic */
    function togglePressed(btn) {
      if (!(btn instanceof HTMLElement)) return;
      const pressed = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", String(!pressed));
    }
    function saveHtml() {
      mutate(noteId, (n) => {
        n.content.html = editor.innerHTML;
      });
    }
    card.querySelector(".ctl-bold")?.addEventListener("click", (ev) => {
      editor.focus();
      document.execCommand("bold");
      togglePressed(ev.currentTarget);
      saveHtml();
    });
    card.querySelector(".ctl-italic")?.addEventListener("click", (ev) => {
      editor.focus();
      document.execCommand("italic");
      togglePressed(ev.currentTarget);
      saveHtml();
    });

    /* Alignment (focus before exec) */
    function execJustify(cmd, btn) {
      editor.focus();
      document.execCommand(cmd);
      if (btn) togglePressed(btn);
      saveHtml();
    }
    card
      .querySelector(".align-left")
      ?.addEventListener("click", (e) =>
        execJustify("justifyLeft", e.currentTarget)
      );
    card
      .querySelector(".align-center")
      ?.addEventListener("click", (e) =>
        execJustify("justifyCenter", e.currentTarget)
      );
    card
      .querySelector(".align-right")
      ?.addEventListener("click", (e) =>
        execJustify("justifyRight", e.currentTarget)
      );
    card
      .querySelector(".align-justify")
      ?.addEventListener("click", (e) =>
        execJustify("justifyFull", e.currentTarget)
      );

    /* Vertical align (use justify-content on column container) */
    valignSel.addEventListener("change", (e) => {
      const cls = /** @type {HTMLSelectElement} */ (e.target).value;
      body.classList.remove("va-top", "va-middle", "va-bottom");
      body.classList.add(cls);
      mutate(noteId, (n) => {
        n.content.style.valign = cls;
      });
    });

    /* Orientation */
    orientSel.addEventListener("change", (e) => {
      const cls = /** @type {HTMLSelectElement} */ (e.target).value;
      body.classList.remove(
        "orient-horizontal",
        "orient-vertical",
        "orient-rotated"
      );
      body.classList.add(cls);
      mutate(noteId, (n) => {
        n.content.style.orientation = cls;
        n.content.html = editor.innerHTML;
      });
    });

    /* Quick styles */
    card.querySelector(".preset-quote")?.addEventListener("click", () => {
      surroundSelectionWith("blockquote");
      body.classList.add("rt-quote");
      saveHtml();
    });
    card.querySelector(".preset-check")?.addEventListener("click", () => {
      insertChecklistAtCaret(editor);
      saveHtml();
    });

    /* Export */
    card
      .querySelector(".export-png")
      ?.addEventListener("click", () => exportAsPNG(noteId, card));
    card
      .querySelector(".export-pdf")
      ?.addEventListener("click", () => exportAsPDF(noteId, card));

    /* Delete */
    card.querySelector(".delete")?.addEventListener("click", () => {
      const left = load().filter((n) => n.id !== noteId);
      save(left);
      card.remove();
    });

    return card;
  }

  /* ---------- Selection Utilities ---------- */
  function surroundSelectionWith(tagName) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      const el = document.createElement(tagName);
      el.innerHTML = "<p>Your quote here…</p>";
      range.insertNode(el);
      // move caret into block
      sel.removeAllRanges();
      const r = document.createRange();
      const target = el.firstChild?.firstChild || el.firstChild || el;
      r.setStart(target, 0);
      r.collapse(true);
      sel.addRange(r);
    } else {
      const wrapper = document.createElement(tagName);
      try {
        range.surroundContents(wrapper);
      } catch {
        wrapper.append(range.extractContents());
        range.insertNode(wrapper);
      }
    }
  }

  function closest(el, selector) {
    while (el && el.nodeType === 1) {
      if (el.matches(selector)) return el;
      el = el.parentElement;
    }
    return null;
  }

  /**
   * Insert ONE checklist item.
   * - If text is selected: convert selection into one checkbox item.
   * - If inside an existing checklist: insert one item after current <li>.
   * - Else: create a new UL.checklist with one item.
   */
  function insertChecklistAtCaret(editor) {
    editor.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    // Find current UL.checklist if caret is inside one
    const startNode =
      range.startContainer.nodeType === 1
        ? range.startContainer
        : range.startContainer.parentElement;
    const currentUl = startNode ? closest(startNode, "ul.checklist") : null;

    let selectedText = sel.toString().trim();
    const li = document.createElement("li");
    li.innerHTML = `<label><input type="checkbox"> ${
      selectedText || "New item"
    }</label>`;

    if (currentUl) {
      const currentLi = closest(startNode, "li");
      if (currentLi && currentLi.parentElement === currentUl) {
        currentLi.insertAdjacentElement("afterend", li);
      } else {
        currentUl.appendChild(li);
      }
    } else {
      const ul = document.createElement("ul");
      ul.className = "checklist";

      if (!range.collapsed) {
        // Replace selection with one checklist item
        range.deleteContents();
      }
      ul.appendChild(li);
      range.insertNode(ul);
    }

    // Place caret at end of new item’s text
    sel.removeAllRanges();
    const label = li.querySelector("label");
    let textNode =
      label && label.lastChild && label.lastChild.nodeType === 3
        ? label.lastChild
        : null;
    if (!textNode) {
      textNode = document.createTextNode("");
      label?.appendChild(textNode);
    }
    const r = document.createRange();
    r.setStart(textNode, textNode.textContent.length);
    r.collapse(true);
    sel.addRange(r);
  }

  /* ---------- Create note ---------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const t = title.value.trim();
    if (!t) return;
    const note = makeNote(t);
    const notes = load();
    notes.unshift(note);
    save(notes);
    stack.prepend(renderCard(note));
    form.reset();
    title.focus();
  });

  renderAll();
})();
