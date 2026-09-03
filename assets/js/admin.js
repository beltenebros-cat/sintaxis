(function () {
  "use strict";

  const CURSOS = {
    "1-eso": "1º ESO",
    "2-eso": "2º ESO",
    "3-eso": "3º ESO",
    "4-eso": "4º ESO",
    "1-bach": "1º Bachillerato",
    "2-bach": "2º Bachillerato",
  };

  const BLOQUES = {
    gramatica: "Gramática",
    literatura: "Literatura",
    "comentario-texto": "Comentario de texto",
    ortografia: "Ortografía",
    lecturas: "Lecturas",
    "expresion-escrita": "Expresión escrita",
    otros: "Otros",
  };

  const TIPOS = {
    apuntes: "Apuntes",
    ejercicios: "Ejercicios",
    examenes: "Exámenes",
    presentaciones: "Presentaciones",
    otros: "Otros",
  };

  const STORAGE_KEY = "sintaxis-admin-config";

  const els = {
    owner: document.getElementById("owner"),
    repo: document.getElementById("repo"),
    branch: document.getElementById("branch"),
    token: document.getElementById("token"),
    saveConfig: document.getElementById("save-config"),
    configStatus: document.getElementById("config-status"),
    curso: document.getElementById("curso"),
    bloque: document.getElementById("bloque"),
    tipo: document.getElementById("tipo"),
    file: document.getElementById("file"),
    upload: document.getElementById("upload"),
    statusLog: document.getElementById("status-log"),
    tabWrite: document.getElementById("tab-write"),
    tabFile: document.getElementById("tab-file"),
    panelWrite: document.getElementById("panel-write"),
    panelFile: document.getElementById("panel-file"),
    titulo: document.getElementById("titulo"),
    contenido: document.getElementById("contenido"),
    publishText: document.getElementById("publish-text"),
  };

  function populateSelect(select, dict) {
    for (const [slug, label] of Object.entries(dict)) {
      const opt = document.createElement("option");
      opt.value = slug;
      opt.textContent = label;
      select.appendChild(opt);
    }
  }

  function loadConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const cfg = JSON.parse(raw);
      if (cfg.owner) els.owner.value = cfg.owner;
      if (cfg.repo) els.repo.value = cfg.repo;
      if (cfg.branch) els.branch.value = cfg.branch;
      if (cfg.token) els.token.value = cfg.token;
    } catch {
      /* localStorage no disponible: se pedirá cada vez */
    }
  }

  function saveConfig() {
    const cfg = {
      owner: els.owner.value.trim(),
      repo: els.repo.value.trim(),
      branch: els.branch.value.trim() || "main",
      token: els.token.value.trim(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      els.configStatus.textContent = "Guardado.";
    } catch {
      els.configStatus.textContent = "No se pudo guardar (localStorage bloqueado).";
    }
    setTimeout(() => (els.configStatus.textContent = ""), 2500);
  }

  function getConfig() {
    return {
      owner: els.owner.value.trim(),
      repo: els.repo.value.trim(),
      branch: els.branch.value.trim() || "main",
      token: els.token.value.trim(),
    };
  }

  function log(msg) {
    els.statusLog.hidden = false;
    els.statusLog.textContent += msg + "\n";
    els.statusLog.scrollTop = els.statusLog.scrollHeight;
  }

  function sanitizeFilename(name) {
    return name.replace(/[^\w.\-áéíóúÁÉÍÓÚñÑüÜ() ]/g, "").trim();
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "sin-titulo";
  }

  function textToBase64(text) {
    const bytes = new TextEncoder().encode(text);
    return arrayBufferToBase64(bytes.buffer);
  }

  function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  }

  async function readFileAsBase64(file) {
    const buffer = await file.arrayBuffer();
    return arrayBufferToBase64(buffer);
  }

  function apiUrl(cfg, path) {
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    return `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodedPath}`;
  }

  async function getExistingSha(cfg, path) {
    const res = await fetch(`${apiUrl(cfg, path)}?ref=${encodeURIComponent(cfg.branch)}`, {
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (res.status === 200) {
      const data = await res.json();
      return data.sha;
    }
    if (res.status === 404) return null;
    throw new Error(`No se pudo comprobar si el archivo ya existe (HTTP ${res.status}).`);
  }

  async function uploadFile(cfg, path, base64Content, sha) {
    const body = {
      message: `Subir material: ${path}`,
      content: base64Content,
      branch: cfg.branch,
    };
    if (sha) body.sha = sha;

    const res = await fetch(apiUrl(cfg, path), {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `HTTP ${res.status}`);
    }
  }

  async function handleUpload() {
    const cfg = getConfig();
    if (!cfg.owner || !cfg.repo || !cfg.token) {
      log("Falta configurar propietario, repositorio o token (paso 1).");
      return;
    }
    const files = els.file.files;
    if (!files || files.length === 0) {
      log("Selecciona al menos un archivo.");
      return;
    }

    const curso = els.curso.value;
    const bloque = els.bloque.value;
    const tipo = els.tipo.value;

    els.upload.disabled = true;
    els.statusLog.hidden = false;
    els.statusLog.textContent = "";

    for (const file of files) {
      const filename = sanitizeFilename(file.name);
      const path = `materiales/${curso}/${bloque}/${tipo}/${filename}`;
      log(`Subiendo "${filename}"…`);
      try {
        const [base64, sha] = await Promise.all([
          readFileAsBase64(file),
          getExistingSha(cfg, path),
        ]);
        await uploadFile(cfg, path, base64, sha);
        log(`✔ "${filename}" subido a ${path}`);
      } catch (err) {
        log(`✘ Error subiendo "${filename}": ${err.message}`);
      }
    }

    log("Listo. La portada se actualizará en 1-2 minutos.");
    els.upload.disabled = false;
    els.file.value = "";
  }

  async function handlePublishText() {
    const cfg = getConfig();
    if (!cfg.owner || !cfg.repo || !cfg.token) {
      log("Falta configurar propietario, repositorio o token (paso 1).");
      return;
    }

    const titulo = els.titulo.value.trim();
    const cuerpo = els.contenido.value.trim();
    if (!titulo || !cuerpo) {
      log("Escribe un título y contenido antes de publicar.");
      return;
    }

    const curso = els.curso.value;
    const bloque = els.bloque.value;
    const tipo = els.tipo.value;
    const filename = `${slugify(titulo)}.md`;
    const path = `materiales/${curso}/${bloque}/${tipo}/${filename}`;
    const contenidoCompleto = `# ${titulo}\n\n${cuerpo}\n`;

    els.publishText.disabled = true;
    els.statusLog.hidden = false;
    els.statusLog.textContent = "";
    log(`Publicando "${titulo}"…`);

    try {
      const [base64, sha] = await Promise.all([
        Promise.resolve(textToBase64(contenidoCompleto)),
        getExistingSha(cfg, path),
      ]);
      await uploadFile(cfg, path, base64, sha);
      log(`✔ Publicado en ${path}`);
      log("Listo. La página se verá en la web en 1-2 minutos.");
      els.titulo.value = "";
      els.contenido.value = "";
    } catch (err) {
      log(`✘ Error al publicar: ${err.message}`);
    }

    els.publishText.disabled = false;
  }

  function switchTab(mode) {
    const isWrite = mode === "write";
    els.tabWrite.classList.toggle("active", isWrite);
    els.tabFile.classList.toggle("active", !isWrite);
    els.panelWrite.hidden = !isWrite;
    els.panelFile.hidden = isWrite;
  }

  populateSelect(els.curso, CURSOS);
  populateSelect(els.bloque, BLOQUES);
  populateSelect(els.tipo, TIPOS);
  loadConfig();

  els.saveConfig.addEventListener("click", saveConfig);
  els.upload.addEventListener("click", handleUpload);
  els.publishText.addEventListener("click", handlePublishText);
  els.tabWrite.addEventListener("click", () => switchTab("write"));
  els.tabFile.addEventListener("click", () => switchTab("file"));
})();
