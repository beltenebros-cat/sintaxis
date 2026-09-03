(function () {
  "use strict";

  const state = {
    manifest: null,
    search: "",
    curso: "",
    bloque: "",
    tipo: "",
  };

  const els = {
    search: document.getElementById("search"),
    filterCurso: document.getElementById("filter-curso"),
    filterBloque: document.getElementById("filter-bloque"),
    filterTipo: document.getElementById("filter-tipo"),
    results: document.getElementById("results"),
    resultsCount: document.getElementById("results-count"),
  };

  function formatSize(bytes) {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" });
  }

  function populateSelect(select, dict) {
    for (const [slug, label] of Object.entries(dict)) {
      const opt = document.createElement("option");
      opt.value = slug;
      opt.textContent = label;
      select.appendChild(opt);
    }
  }

  function matches(file) {
    if (state.curso && file.curso !== state.curso) return false;
    if (state.bloque && file.bloque !== state.bloque) return false;
    if (state.tipo && file.tipo !== state.tipo) return false;
    if (state.search) {
      const q = state.search.toLowerCase();
      const haystack = (file.title + " " + file.filename).toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }

  function render() {
    const m = state.manifest;
    if (!m) return;

    const filtered = m.files.filter(matches);

    els.resultsCount.textContent =
      filtered.length === 0
        ? "Sin resultados"
        : `${filtered.length} archivo${filtered.length === 1 ? "" : "s"}`;

    els.results.innerHTML = "";

    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No hay materiales que coincidan con la búsqueda.";
      els.results.appendChild(empty);
      return;
    }

    const cursoOrder = Object.keys(m.cursos);
    const byCurso = new Map();
    for (const file of filtered) {
      const key = file.curso || "otros";
      if (!byCurso.has(key)) byCurso.set(key, []);
      byCurso.get(key).push(file);
    }

    const sortedCursoKeys = [...byCurso.keys()].sort(
      (a, b) => cursoOrder.indexOf(a) - cursoOrder.indexOf(b)
    );

    for (const cursoKey of sortedCursoKeys) {
      const cursoLabel = m.cursos[cursoKey] || "Otros";
      const section = document.createElement("section");
      section.className = "curso-group";
      const h2 = document.createElement("h2");
      h2.textContent = cursoLabel;
      section.appendChild(h2);

      const filesInCurso = byCurso.get(cursoKey);
      const byBloque = new Map();
      for (const file of filesInCurso) {
        const key = file.bloque || "otros";
        if (!byBloque.has(key)) byBloque.set(key, []);
        byBloque.get(key).push(file);
      }

      for (const [bloqueKey, files] of byBloque) {
        const bloqueLabel = m.bloques[bloqueKey] || "Otros";
        const bGroup = document.createElement("div");
        bGroup.className = "bloque-group";
        const h3 = document.createElement("h3");
        h3.textContent = bloqueLabel;
        bGroup.appendChild(h3);

        const ul = document.createElement("ul");
        ul.className = "file-list";

        for (const file of files) {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.className = "file-card";
          if (file.ext === "md") {
            a.href = "ver.html?path=" + encodeURIComponent(file.path);
          } else {
            a.href = file.path;
            a.target = "_blank";
            a.rel = "noopener";
          }

          const icon = document.createElement("div");
          icon.className = "file-icon";
          icon.textContent = file.ext || "?";

          const meta = document.createElement("div");
          meta.className = "file-meta";
          const title = document.createElement("p");
          title.className = "file-title";
          title.textContent = file.title;
          const sub = document.createElement("p");
          sub.className = "file-sub";
          const parts = [formatSize(file.sizeBytes), formatDate(file.addedDate)].filter(Boolean);
          sub.textContent = parts.join(" · ");
          meta.appendChild(title);
          meta.appendChild(sub);

          const chip = document.createElement("span");
          chip.className = "tipo-chip";
          chip.textContent = m.tipos[file.tipo] || "Otros";

          a.appendChild(icon);
          a.appendChild(meta);
          a.appendChild(chip);
          li.appendChild(a);
          ul.appendChild(li);
        }

        bGroup.appendChild(ul);
        section.appendChild(bGroup);
      }

      els.results.appendChild(section);
    }
  }

  function wireEvents() {
    els.search.addEventListener("input", (e) => {
      state.search = e.target.value.trim();
      render();
    });
    els.filterCurso.addEventListener("change", (e) => {
      state.curso = e.target.value;
      render();
    });
    els.filterBloque.addEventListener("change", (e) => {
      state.bloque = e.target.value;
      render();
    });
    els.filterTipo.addEventListener("change", (e) => {
      state.tipo = e.target.value;
      render();
    });
  }

  fetch("data/manifest.json", { cache: "no-store" })
    .then((r) => r.json())
    .then((manifest) => {
      state.manifest = manifest;
      populateSelect(els.filterCurso, manifest.cursos);
      populateSelect(els.filterBloque, manifest.bloques);
      populateSelect(els.filterTipo, manifest.tipos);
      wireEvents();
      render();
    })
    .catch((err) => {
      els.results.innerHTML =
        '<div class="empty-state">No se ha podido cargar el índice de materiales.</div>';
      console.error(err);
    });
})();
