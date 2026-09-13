/* Fotostreifen + Lightbox für die Neufahrzeug-Modellkarten.
   Wird von neufahrzeuge.html und verkauf.html geteilt — vorher lag die Logik doppelt
   inline in den Seiten. Die Seite liefert nur das Markup:

     <div class="nf-fotos" data-modell="LMC e:dero 350 D" data-praefix="edero-350d" data-count="12">
       <img src="assets/neufahrzeuge/edero-350d-01.webp" alt="..." loading="lazy">
       ... (beliebig viele sichtbare Kacheln, üblicherweise 4)
     </div>

   data-count = Gesamtzahl der Fotos der Serie (edero-350d-01.webp … -12.webp).
   Beim Hinzufügen/Entfernen von Fotos muss data-count mitgezogen werden.
   Das Lightbox-Markup baut dieses Skript selbst, sofern die Seite keins mitbringt. */
(function () {
  'use strict';

  const streifen = document.querySelectorAll('.nf-fotos[data-praefix]');
  if (!streifen.length) return;

  // ---------- Lightbox bereitstellen ----------
  let lb = document.getElementById('lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.id = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Modellgalerie');
    lb.hidden = true;
    lb.innerHTML =
      '<button type="button" class="lb-close" id="lb-close" aria-label="Galerie schließen">&#10005;</button>' +
      '<button type="button" class="lb-nav lb-prev" id="lb-prev" aria-label="Vorheriges Bild">&#10094;</button>' +
      '<figure class="lb-stage">' +
        '<img id="lb-img" alt="">' +
        '<figcaption class="lb-caption"><span id="lb-title"></span><span id="lb-counter"></span></figcaption>' +
      '</figure>' +
      '<button type="button" class="lb-nav lb-next" id="lb-next" aria-label="Nächstes Bild">&#10095;</button>';
    document.body.appendChild(lb);
  }

  const lbImg     = document.getElementById('lb-img');
  const lbTitle   = document.getElementById('lb-title');
  const lbCounter = document.getElementById('lb-counter');
  const lbClose   = document.getElementById('lb-close');

  let lbBilder = [];
  let lbIndex  = 0;
  let lbAusloeser = null;

  const lbZeigen = (i) => {
    if (!lbBilder.length) return;
    lbIndex = (i + lbBilder.length) % lbBilder.length;
    lbImg.src = lbBilder[lbIndex];
    lbCounter.textContent = (lbIndex + 1) + ' / ' + lbBilder.length;
    [lbIndex + 1, lbIndex - 1].forEach(n => {
      const v = (n + lbBilder.length) % lbBilder.length;
      new Image().src = lbBilder[v];
    });
  };

  const lbOeffnen = (bilder, titel, start, ausloeser) => {
    lbBilder = bilder;
    lbTitle.textContent = titel;
    lbAusloeser = ausloeser || null;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lbZeigen(start);
    lbClose.focus();
  };

  const lbSchliessen = () => {
    lb.hidden = true;
    lbImg.removeAttribute('src');
    document.body.style.overflow = '';
    if (lbAusloeser) { lbAusloeser.focus(); lbAusloeser = null; }
  };

  // ---------- Kacheln verdrahten ----------
  streifen.forEach(reihe => {
    const praefix = reihe.dataset.praefix;
    const modell  = reihe.dataset.modell || '';

    /* Bildliste: entweder feste Liste in data-dateien (kommagetrennt, relativ zu
       assets/neufahrzeuge/ — erlaubt Lücken, andere Endungen und eigene Reihenfolge)
       oder fortlaufend <praefix>-01.webp … bis data-count. */
    // data-ordner / data-endung erlauben andere Serien, z. B. die Mietwohnwagen (assets/vermietung/sandy/, .jpg)
    const ordner = reihe.dataset.ordner || 'assets/neufahrzeuge/';
    const endung = reihe.dataset.endung || '.webp';
    const liste = (reihe.dataset.dateien || '').split(',').map(s => s.trim()).filter(Boolean);
    const alle = liste.length
      ? liste.map(d => ordner + d)
      : Array.from({ length: parseInt(reihe.dataset.count, 10) || 0 }, (_, n) =>
          ordner + praefix + '-' + String(n + 1).padStart(2, '0') + endung);
    const gesamt = alle.length;
    if (!gesamt) return;

    /* Variante mit großem Foto (neufahrzeuge.html): liegt in .nf-medien ein .nf-hauptbild,
       tauschen die Vorschaubilder das große Foto aus, und erst ein Klick aufs große Foto
       (oder auf „+N Fotos") öffnet die Galerie. Ohne .nf-hauptbild (verkauf.html) öffnet
       jede Kachel direkt die Galerie. */
    const haupt    = reihe.closest('.nf-medien')?.querySelector('.nf-hauptbild');
    const hauptImg = haupt?.querySelector('img');
    let hauptIndex = hauptImg ? Math.max(0, alle.indexOf(hauptImg.getAttribute('src'))) : 0;

    const bilder = Array.from(reihe.querySelectorAll('img'));
    const kacheln = [];

    const hauptZeigen = (index, bild, knopf) => {
      if (!hauptImg || index === hauptIndex) return;
      hauptIndex = index;
      haupt.classList.add('is-wechsel');
      const neu = new Image();
      neu.onload = neu.onerror = () => {
        hauptImg.src = bild.getAttribute('src');
        hauptImg.alt = bild.alt;
        haupt.classList.remove('is-wechsel');
      };
      neu.src = bild.getAttribute('src');
      kacheln.forEach(k => k.classList.toggle('is-aktiv', k === knopf));
    };

    bilder.forEach((bild, i) => {
      const knopf = document.createElement('button');
      knopf.type = 'button';
      knopf.className = 'nf-kachel';
      bild.replaceWith(knopf);
      knopf.appendChild(bild);
      kacheln.push(knopf);

      // Startbild = das angeklickte Foto, egal an welcher Stelle der Serie es steht
      const treffer = alle.indexOf(bild.getAttribute('src'));
      const start = treffer < 0 ? i : treffer;
      const letzteMitMehr = i === bilder.length - 1 && gesamt > bilder.length;

      if (haupt && !letzteMitMehr) {
        knopf.setAttribute('aria-label', 'Foto groß anzeigen: ' + bild.alt);
        if (start === hauptIndex) knopf.classList.add('is-aktiv');
        knopf.addEventListener('click', () => hauptZeigen(start, bild, knopf));
        // Desktop: schon beim Drüberfahren wechseln
        knopf.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hauptZeigen(start, bild, knopf); });
      } else {
        knopf.setAttribute('aria-label', 'Alle ' + gesamt + ' Fotos ansehen: ' + modell);
        knopf.addEventListener('click', () => lbOeffnen(alle, modell, start, knopf));
      }

      // Auf der letzten sichtbaren Kachel steht, wie viele Fotos noch dahinterstecken
      if (letzteMitMehr) {
        const mehr = document.createElement('span');
        mehr.className = 'nf-mehr';
        mehr.textContent = '+' + (gesamt - bilder.length) + ' Fotos';
        knopf.appendChild(mehr);
      }
    });

    if (haupt) haupt.addEventListener('click', () => lbOeffnen(alle, modell, hauptIndex, haupt));
  });

  // ---------- Bedienung ----------
  lbClose.addEventListener('click', lbSchliessen);
  document.getElementById('lb-prev').addEventListener('click', () => lbZeigen(lbIndex - 1));
  document.getElementById('lb-next').addEventListener('click', () => lbZeigen(lbIndex + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) lbSchliessen(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape')     lbSchliessen();
    if (e.key === 'ArrowLeft')  lbZeigen(lbIndex - 1);
    if (e.key === 'ArrowRight') lbZeigen(lbIndex + 1);
  });

  let touchX = null;
  lb.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const diff = e.changedTouches[0].clientX - touchX;
    if (Math.abs(diff) > 45) lbZeigen(lbIndex + (diff < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });
})();
