export const escapeHtml = value => String(value).replace(/[&<>"']/g,
    character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const time = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const list = items => `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;

export function renderHtml(doc, { images, css } = {}) {
    const e = escapeHtml;
    const exported = Boolean(images);
    const steps = doc.steps.map((step, index) => `
        <article class="step" id="${e(step.id)}">
            <div class="step-head"><span class="step-number">${String(index + 1).padStart(2, "0")}</span>
                <div><span class="eyebrow">STEP ${index + 1} / ${doc.steps.length}</span><h2>${e(step.title)}</h2></div>
                <span class="timestamp">${time(step.timestampSeconds)}</span></div>
            <div class="step-grid">
                <figure><a class="frame-link" href="${images ? images[step.frame] : `/frames/${e(step.frame)}`}" ${exported ? "" : 'data-zoom="true"'} aria-label="Enlarge screenshot: ${e(step.title)}">
                    <img src="${images ? images[step.frame] : `/frames/${e(step.frame)}`}" alt="${e(step.caption)}" ${exported ? "" : 'loading="lazy"'} width="1600" height="900"></a>
                    <figcaption><span class="timestamp">${time(step.timestampSeconds)}</span> ${e(step.caption)}</figcaption></figure>
                <div class="instructions"><h3>Action</h3><p>${e(step.instruction)}</p>
                    ${step.command ? `<pre><code>${e(step.command)}</code></pre>` : ""}
                    <h3>Expected outcome</h3><p>${e(step.expected)}</p>
                    ${step.caution ? `<div class="caution"><strong>Review note</strong><p>${e(step.caution)}</p></div>` : ""}
                    <p class="evidence">Evidence: ${e(step.evidence)}</p></div>
            </div>
        </article>`).join("");
    return `<!doctype html><html lang="en"><head><meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(doc.title)} | SOP</title>
        ${css ? `<style>${css}</style>` : '<link rel="stylesheet" href="/style.css"><script src="/client.js" defer></script>'}
        </head><body>
        <header class="topbar"><div class="brand"><span class="brand-mark">S</span> SOP Studio <span class="muted">/ Video evidence</span></div>
            ${exported ? '<span class="badge">Standalone document</span>' : '<a class="button" href="/export" download>Download HTML + screenshots</a>'}</header>
        <div class="layout"><aside><div class="eyebrow">IN THIS PROCEDURE</div>
            <nav aria-label="Procedure steps"><a href="#overview">Overview &amp; prerequisites</a>
            ${doc.steps.map((step, index) => `<a href="#${e(step.id)}"><span>${String(index + 1).padStart(2, "0")}</span>${e(step.title)}</a>`).join("")}
            <a href="#review">Review before publication</a></nav>
            <div class="aside-note">Evidence-linked draft<br>Not an approved procedure</div></aside>
        <main><section id="overview" class="overview">
            <div class="title-line"><span class="eyebrow">${e(doc.reference)} &middot; VERSION ${e(doc.version)}</span><span class="badge">DRAFT / REVIEW REQUIRED</span></div>
            <h1>${e(doc.title)}</h1><p class="subtitle">${e(doc.subtitle)}</p>
            <div class="metrics"><div><strong>${doc.steps.length}</strong><span>documented steps</span></div>
                <div><strong>${doc.steps.length}</strong><span>evidence screenshots</span></div>
                <div><strong>${time(Math.round(doc.source.durationSeconds))}</strong><span>source recording</span></div></div>
            <div class="notice"><strong>Prototype, not an approved SOP.</strong> ${e(doc.source.method)} ${e(doc.source.note)}</div>
            <div class="overview-grid"><div><h2>Purpose</h2><p>${e(doc.purpose)}</p><p class="muted">Source: ${e(doc.source.name)}</p>
                <h2>Prerequisites</h2>${list(doc.prerequisites)}</div>
                <div class="safety"><h2>Safety &amp; limitations</h2>${list(doc.warnings)}</div></div>
        </section>
        ${exported ? "" : '<div class="filterbar"><label for="search">Find a step</label><input id="search" type="search" placeholder="Search actions, commands, or outcomes..." autocomplete="off"><span id="count" role="status"></span></div><p id="empty" hidden>No steps match. Clear the search to see the full procedure.</p>'}
        <section aria-label="Procedure">${steps}</section>
        <section id="review" class="review"><span class="eyebrow">HUMAN VALIDATION</span><h2>Review before publication</h2>
            <p>${e(doc.status)}. The items below are pending checks, not completed validations.</p>${list(doc.reviewChecklist)}</section>
        <footer>${e(doc.reference)} &middot; Draft v${e(doc.version)} &middot; Based on selected visual evidence; no audio transcription.</footer>
        </main></div>
        ${exported ? "" : '<dialog id="zoom" aria-labelledby="zoom-title"><div class="dialog-head"><h2 id="zoom-title">Evidence screenshot</h2><button id="close-zoom" type="button">Close</button></div><img id="zoom-image" alt=""><p id="zoom-caption"></p></dialog>'}
        </body></html>`;
}
