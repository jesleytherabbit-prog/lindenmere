// ==UserScript==
// @name         Lindenmere, 1924 · del foro al tracker
// @namespace    https://jesleytherabbit-prog.github.io/lindenmere/
// @version      0.1
// @description  En el tema del Acontecimiento, junta los dados de cada excursionista; en cualquier tema, detecta fichas de excursionista. Lo copia todo para pegarlo en el tracker («Pegar del foro»).
// @match        https://hp-avada-kedavra.foroactivo.com/t*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // ---------------------------------------------------------------- configuración
  const TEMA = '';               // ID del tema de turnos, por ejemplo 't38000'. Vacío: solo detecta fichas.
  const MASTER = 'Hana Park';
  const DADOS = 'Dados Mágicos'; // la cuenta del foro que publica las tiradas

  // ---------------------------------------------------------------- leer los posts de una página
  function leerPagina(doc, url) {
    const out = [];
    doc.querySelectorAll('div.post[id^="p"]').forEach(el => {
      const au = el.querySelector('p.author'); if (!au) return;
      const autor = ((au.querySelector('strong') || {}).textContent || '').trim();
      const cont = el.querySelector('.content');
      out.push({ pid: +el.id.slice(1), autor, html: cont ? cont.innerHTML : '', texto: cont ? (cont.textContent || '').replace(/\s+/g, ' ') : '', url: url.split('#')[0] + '#' + el.id.slice(1) });
    });
    return out;
  }
  async function leerTodo() {
    const aqui = location.href.split('#')[0];
    const urls = new Set([aqui]);
    if (TEMA) document.querySelectorAll('a[href*="/' + TEMA + '"]').forEach(a => { const h = a.href.split('#')[0].split('?')[0]; if (new RegExp('/' + TEMA + '(p\\d+)?-').test(h)) urls.add(h); });
    let posts = [];
    for (const u of urls) {
      if (u === aqui) { posts = posts.concat(leerPagina(document, u)); continue; }
      try { const r = await fetch(u, { credentials: 'include' }); posts = posts.concat(leerPagina(new DOMParser().parseFromString(await r.text(), 'text/html'), u)); }
      catch (e) { console.warn('Lindenmere: no pude leer', u, e); }
    }
    const vistos = new Set();
    return posts.filter(p => !vistos.has(p.pid) && vistos.add(p.pid)).sort((a, b) => a.pid - b.pid);
  }

  // ---------------------------------------------------------------- fichas de excursionista
  function fichas(posts) {
    const out = [];
    posts.forEach(p => {
      const re = /class="?lf-data"?[^>]*>([\s\S]*?)<\/span>/gi; let m;
      while ((m = re.exec(p.html))) {
        const t = document.createElement('textarea'); t.innerHTML = m[1];
        try { const o = JSON.parse(t.value); if (o && o.nombre) out.push(o); } catch (e) { console.warn('Lindenmere: ficha ilegible en', p.url); }
      }
    });
    return out;
  }

  // ---------------------------------------------------------------- dados del tema
  // «El miembro 'Nombre' ha efectuado la acción siguiente: ... 'D10' : 7»
  function tiradas(posts) {
    const out = [];
    let ultimo = {}; // último post de cada autor, para sacar de ahí la acción
    posts.forEach(p => {
      if (p.autor !== DADOS) { if (p.autor && p.autor !== MASTER) ultimo[p.autor] = p; return; }
      const m = p.texto.match(/El miembro\s*'\s*([^']+?)\s*'[\s\S]*?'D10'\s*:\s*([\d,\s]+)/i); if (!m) return;
      const autor = m[1].trim(), post = ultimo[autor];
      m[2].split(/[,\s]+/).filter(Boolean).forEach((d, i) => out.push({ autor, d: +d, i, pid: p.pid, url: (post || p).url, acc: '' }));
    });
    return out;
  }

  // ---------------------------------------------------------------- interfaz
  const css = document.createElement('style');
  css.textContent = `#lmf{position:fixed;right:14px;bottom:14px;z-index:99999;padding:8px 14px;border:1px solid #B39A70;background:#24352E;color:#E9DFC9;font:14px Georgia,serif;letter-spacing:1px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.4)}
#lmf-p{position:fixed;right:14px;bottom:56px;z-index:99999;width:min(420px,calc(100vw - 28px));max-height:70vh;overflow:auto;background:#E9DFC9;color:#3f342c;border:1px solid #67564A;padding:14px 16px;font:14px Georgia,serif;box-shadow:0 8px 24px rgba(0,0,0,.45)}
#lmf-p h4{margin:0 0 8px;font:600 15px Georgia,serif;color:#24352E;letter-spacing:2px}
#lmf-p ul{margin:6px 0;padding-left:18px}#lmf-p button{margin:8px 8px 0 0;padding:6px 12px;border:1px solid #B39A70;background:#24352E;color:#E9DFC9;font:13px Georgia,serif;cursor:pointer}
#lmf-p label{display:block;margin-top:6px}#lmf-p input{width:100%;font:14px Georgia,serif;padding:3px 6px}`;
  document.head.appendChild(css);

  const esTema = TEMA && new RegExp('/' + TEMA + '(p\\d+)?-').test(location.pathname);
  const hayFicha = document.querySelector('.lf-data');
  if (!esTema && !hayFicha) return;

  const btn = document.createElement('button'); btn.id = 'lmf'; btn.type = 'button';
  btn.textContent = esTema ? 'Lindenmere · tracker' : 'Ficha al tracker'; document.body.appendChild(btn);
  btn.addEventListener('click', async () => {
    let panel = document.getElementById('lmf-p'); if (panel) { panel.remove(); return; }
    panel = document.createElement('div'); panel.id = 'lmf-p'; panel.textContent = 'Leyendo el tema...'; document.body.appendChild(panel);
    const posts = esTema ? await leerTodo() : leerPagina(document, location.href);
    const F = fichas(posts), T = esTema ? tiradas(posts) : [];
    const porPJ = {}; T.forEach(t => (porPJ[t.autor] = porPJ[t.autor] || []).push(t.d));
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    panel.innerHTML = `<h4>LINDENMERE · DEL FORO AL TRACKER</h4>
      ${F.length ? `<div>Fichas de excursionista:</div><ul>${F.map(f => `<li>${esc(f.nombre)} (${esc(f.grupo || '')})</li>`).join('')}</ul>` : ''}
      ${esTema ? `<div>Dados encontrados:</div><ul>${Object.entries(porPJ).map(([a, d]) => `<li>${esc(a)}: ${d.join(', ')}</li>`).join('') || '<li>ninguno</li>'}</ul>
      <label>Turno (como quieres que aparezca en el Registro)<input id="lmf-t" placeholder="Turno 3 · Día 1, medianoche"></label>` : ''}
      <button id="lmf-c">Copiar para el tracker</button><button id="lmf-x">Cerrar</button><div id="lmf-m"></div>`;
    panel.querySelector('#lmf-x').onclick = () => panel.remove();
    panel.querySelector('#lmf-c').onclick = async () => {
      const turno = (panel.querySelector('#lmf-t') || {}).value || '';
      const payload = { tipo: 'lindenmere-foro', v: 1, ts: Date.now(), turno: turno.trim(), fichas: F, tiradas: T };
      const txt = JSON.stringify(payload);
      try { await navigator.clipboard.writeText(txt); panel.querySelector('#lmf-m').textContent = 'Copiado. En el tracker: Vista de máster, «Pegar del foro».'; }
      catch (e) { const ta = document.createElement('textarea'); ta.value = txt; ta.style.width = '100%'; ta.rows = 4; panel.appendChild(ta); ta.select(); panel.querySelector('#lmf-m').textContent = 'No pude copiar solo: selecciona el texto de abajo y cópialo.'; }
    };
  });
})();
