(function (global) {
  "use strict";

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderInline(text) {
    let out = escapeHtml(text);
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    return out;
  }

  function renderMarkdown(md) {
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    const html = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.trim() === "") {
        i++;
        continue;
      }

      const heading = line.match(/^(#{1,3})\s+(.*)$/);
      if (heading) {
        const level = heading[1].length;
        html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
        i++;
        continue;
      }

      if (/^[-*]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
          items.push(`<li>${renderInline(lines[i].replace(/^[-*]\s+/, ""))}</li>`);
          i++;
        }
        html.push(`<ul>${items.join("")}</ul>`);
        continue;
      }

      if (/^\d+[.)]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\d+[.)]\s+/.test(lines[i])) {
          items.push(`<li>${renderInline(lines[i].replace(/^\d+[.)]\s+/, ""))}</li>`);
          i++;
        }
        html.push(`<ol>${items.join("")}</ol>`);
        continue;
      }

      const paragraph = [];
      while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,3})\s+/.test(lines[i]) && !/^[-*]\s+/.test(lines[i]) && !/^\d+[.)]\s+/.test(lines[i])) {
        paragraph.push(lines[i]);
        i++;
      }
      html.push(`<p>${paragraph.map(renderInline).join("<br>")}</p>`);
    }

    return html.join("\n");
  }

  global.SintaxisMarkdown = { renderMarkdown };
})(window);
