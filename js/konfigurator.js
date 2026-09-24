/* Gemeinsame Logik fuer Preis- und Neufahrzeug-Konfigurator.
   Extras, Zusammenfassung und Info-Fenster liegen unter teile/ — beide Seiten
   laden dieselbe Quelle, damit Preise nur an einer Stelle gepflegt werden.
   Achtung: das Nachladen braucht HTTP, ueber file:// bleibt die Seite leer. */
(async () => {
  async function einsetzen(id, datei){
    const mount = document.getElementById(id);
    if (!mount) return;
    try {
      const antwort = await fetch(datei);
      if (!antwort.ok) throw new Error(antwort.status);
      mount.outerHTML = await antwort.text();
    } catch (e) {
      mount.innerHTML = '<p style="padding:16px;border:1px solid #c66;border-radius:10px;color:#a33">'
        + 'Die Extras konnten nicht geladen werden. Bitte die Seite neu laden.</p>';
      console.error('Konfigurator-Teil nicht geladen:', datei, e);
    }
  }
  await einsetzen('konfig-extras-mount', 'teile/konfigurator-extras.html');
  await einsetzen('konfig-modal-mount',  'teile/konfigurator-modal.html');
/* ---- Stil aus Schritt 1 (stil-konfigurator.html) ----
   Refurbished (konfigurator.html) und Neufahrzeug (neufahrzeug-konfigurator.html) haben je
   einen eigenen Speicher. Der Stilkonfigurator legt die fertigen
   Textzeilen in sessionStorage ab; hier werden sie angezeigt und in Mail, WhatsApp und PDF
   mitgeschickt. Kein Preis, reine Info. */
  const IST_NEU = (document.body.dataset.konfigMode || 'gebraucht') === 'neu';
  const STIL_SPEICHER = IST_NEU ? 'ventura-stil-neu-v1' : 'ventura-stil-v1';
  const STIL_SEITE = IST_NEU ? 'stil-konfigurator.html?fahrzeug=neu' : 'stil-konfigurator.html';
  function stilLesen(){
    try {
      const d = JSON.parse(sessionStorage.getItem(STIL_SPEICHER) || 'null');
      return d && Array.isArray(d.zeilen) && d.zeilen.length ? d.zeilen : [];
    } catch (e) { return []; }
  }
  /* Summe der Stil-Aufpreise (Schranktüren, Spritzschutz, Arbeitsplatte, Bodenbelag) */
  function stilAufpreisSumme(zeilen){
    return (zeilen || []).reduce((s, z) => s + (parseFloat(z.aufpreis) || 0), 0);
  }
  const htmlSicher = (s) => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

const fmtEuro = (n) => n.toLocaleString('de-DE', {
 minimumFractionDigits: 2, maximumFractionDigits: 2 
}
) + ' €';
   function getSelection(){
  const pkg = document.querySelector('.model-card.selected');
  const chips = Array.from(document.querySelectorAll('.chip.selected'));
  return {
 pkg, chips 
}
;
  
}
   function render(){
  const {
 pkg, chips 
}
 = getSelection();
  const listEl = document.getElementById('summary-list');
  const emptyEl = document.getElementById('summary-empty');
  const totalEl = document.getElementById('summary-total');
  const sendBtn = document.getElementById('btn-send');
  const whatsappBtn = document.getElementById('btn-whatsapp');
  const printBtn = document.getElementById('btn-print');
   listEl.innerHTML = '';
  let total = 0;
  let hasRequestItems = false;
  let count = 0;
   if (pkg){
  count++;
  const price = parseFloat(pkg.dataset.price);
  total += price;
  const row = document.createElement('div');
  row.className = 'summary-line';
  row.innerHTML = `<span>${
pkg.dataset.name
}
</span>
<span class="amt">${
fmtEuro(price)
}
</span>`;
  listEl.appendChild(row);
  
}
   chips.forEach(chip => {
  count++;
  const qty = parseInt(chip.dataset.qty || '1', 10);
  const name = (qty > 1 ? qty + '× ' : '') + chip.dataset.name;
  const priceStr = chip.dataset.price;
  const row = document.createElement('div');
  row.className = 'summary-line';
  if (priceStr === ''){
  hasRequestItems = true;
  row.innerHTML = `<span>${
name
}
</span>
<span class="amt muted">auf Anfrage</span>`;

}
 else {
  const price = parseFloat(priceStr) * qty;
  total += price;
  row.innerHTML = `<span>${
name
}
</span>
<span class="amt">${
fmtEuro(price)
}
</span>`;

}
  listEl.appendChild(row);

}
);
   /* Stil-Block unter den Positionen */
  const stil = stilLesen();
  let stilEl = document.getElementById('summary-stil');
  if (stil !== null){
    if (!stilEl){
      stilEl = document.createElement('div');
      stilEl.id = 'summary-stil';
      stilEl.className = 'summary-stil';
      totalEl.parentNode.insertBefore(stilEl, totalEl);
    }
    if (stil.length){
      const stilAufpreis = stilAufpreisSumme(stil);
      total += stilAufpreis;   // Aufpreise aus Schritt 1 fließen in die Gesamtsumme
      stilEl.classList.remove('is-leer');
      stilEl.innerHTML = '<div class="summary-stil-kopf"><strong>Euer Stil</strong><a href="' + STIL_SEITE + '">ändern</a></div><dl>'
        + stil.map(z => '<dt>' + htmlSicher(z.label) + '</dt><dd>' + htmlSicher(z.wert) + '</dd>').join('') + '</dl>'
        + (stilAufpreis ? '<div class="summary-stil-summe"><span>Aufpreise Stil</span><span>' + fmtEuro(stilAufpreis) + '</span></div>' : '');
    } else {
      stilEl.classList.add('is-leer');
      stilEl.innerHTML = 'Noch keinen Stil gewählt? <a href="' + STIL_SEITE + '">Schritt 1: Stil gestalten →</a>';
    }
  }
   if (count === 0){
  emptyEl.style.display = 'block';
  totalEl.style.display = 'none';
  
}
 else {
  emptyEl.style.display = 'none';
  totalEl.style.display = 'flex';
  totalEl.innerHTML = `<span>Gesamt (ca.)</span>
<span>${
fmtEuro(total)
}
${
hasRequestItems ? '<span class="note">zzgl. Positionen „auf Anfrage"</span>' : ''
}
</span>`;
  
}
   const ready = !!pkg;
  sendBtn.disabled = !ready;
  whatsappBtn.disabled = !ready;
  printBtn.disabled = count === 0;
  
}
   /* ---- Seitenmodus ----
      Welche Seite gerade läuft, steht am <body> als data-konfig-mode:
      "gebraucht" (konfigurator.html) oder "neu" (neufahrzeug-konfigurator.html).
      Beim Neufahrzeug ergeben manche Extras keinen Sinn — die Fenster sind ab Werk neu. */
  const seitenModus = document.body.dataset.konfigMode || 'gebraucht';
  const NUR_GEBRAUCHT = ["TrailView", "100-km/h-Zulassung", "Außendusche Capri"];

  const extrasZaehler = document.querySelector('.extras-head .count');
  /* Ausgangszahl aus dem Text lesen — die DOM-Kacheln zu zählen ginge nicht,
     weil „Empfohlene Extras" dieselben Kacheln ein zweites Mal enthält.
     Die Zahl im Text zählt die Extras des Gebraucht-Konfigurators. */
  const extrasBasis = extrasZaehler ? (parseInt(extrasZaehler.textContent, 10) || 0) : 0;
  const verstecktNamen = new Set();
  let dazu = 0;

  if (seitenModus === 'neu'){
    document.querySelectorAll('.chip').forEach(chip => {
      if (!NUR_GEBRAUCHT.some(k => (chip.dataset.name || '').includes(k))) return;
      chip.hidden = true;
      verstecktNamen.add(chip.dataset.name || "");
    });
  }

  /* Kategorien mit data-nur="neu" (LMC-Werksoptionen) gibt es nur beim Neufahrzeug —
     beim Gebrauchtwagen wird die ganze Kategorie ausgeblendet. */
  document.querySelectorAll('.extras-cat[data-nur]').forEach(kat => {
    const anzahl = kat.querySelectorAll('.chip').length;
    if (kat.dataset.nur !== seitenModus){
      kat.hidden = true;
      kat.querySelectorAll('.chip').forEach(c => { c.hidden = true; });
    } else {
      dazu += anzahl;
    }
  });

  /* Einzelne Kacheln mit data-nur: Kopien, die nur auf einer der beiden Seiten stehen —
     z. B. Mover und Markise ganz oben in den „Empfohlenen Extras" beim Neufahrzeug.
     Sie zählen nicht extra, weil es dieselben Produkte wie in ihrer Kategorie sind. */
  document.querySelectorAll('.chip[data-nur]').forEach(chip => {
    if (chip.closest('.extras-cat[data-nur]')) return;   // schon über die Kategorie geregelt
    if (chip.dataset.nur !== seitenModus) chip.hidden = true;
  });

  if (extrasZaehler) extrasZaehler.textContent = (extrasBasis - verstecktNamen.size + dazu) + ' Extras';

   document.querySelectorAll('.model-card').forEach(card => {
  card.addEventListener('click', (e) => {
  // Der Aufklapper „Welche Wohnwagen passen hier rein?" darf die Karte nicht auswählen
  if (e.target.closest('.model-beispiele')) return;
  const wasSelected = card.classList.contains('selected');
  document.querySelectorAll('.model-card').forEach(c => c.classList.remove('selected'));
  if (!wasSelected) card.classList.add('selected');
  render();
  
}
);
  
}
);
   document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', (e) => {
  if (e.target.closest('.chip-info')) return;
  const wasSelected = chip.classList.contains('selected');
  chip.classList.toggle('selected');
  if (wasSelected){
  chip.dataset.qty = '1';
  const qtyValueEl = chip.querySelector('.qty-value');
  if (qtyValueEl) qtyValueEl.textContent = '1';
  if (chip._resetAccessories) chip._resetAccessories();

}
  render();

}
);

}
);
   document.querySelectorAll('.chip').forEach(chip => {
  chip.dataset.qty = chip.dataset.qty || '1';
  const qtyWrap = document.createElement('div');
  qtyWrap.className = 'chip-qty';
  const minusBtn = document.createElement('button');
  minusBtn.type = 'button';
  minusBtn.className = 'qty-btn qty-minus';
  minusBtn.textContent = '−';
  minusBtn.setAttribute('aria-label', 'Weniger');
  const valueSpan = document.createElement('span');
  valueSpan.className = 'qty-value';
  valueSpan.textContent = chip.dataset.qty;
  const plusBtn = document.createElement('button');
  plusBtn.type = 'button';
  plusBtn.className = 'qty-btn qty-plus';
  plusBtn.textContent = '+';
  plusBtn.setAttribute('aria-label', 'Mehr');
  qtyWrap.appendChild(minusBtn);
  qtyWrap.appendChild(valueSpan);
  qtyWrap.appendChild(plusBtn);
  qtyWrap.addEventListener('click', e => e.stopPropagation());
  minusBtn.addEventListener('click', () => {
  let qty = parseInt(chip.dataset.qty, 10);
  if (qty > 1) qty--;
  chip.dataset.qty = qty;
  valueSpan.textContent = qty;
  if (chip.classList.contains('selected')) render();

}
);
  plusBtn.addEventListener('click', () => {
  let qty = parseInt(chip.dataset.qty, 10);
  qty++;
  chip.dataset.qty = qty;
  valueSpan.textContent = qty;
  if (!chip.classList.contains('selected')) chip.classList.add('selected');
  render();

}
);
  const textEl = chip.querySelector('.chip-text');
  if (textEl) textEl.appendChild(qtyWrap);

}
);
   const modalOverlay = document.getElementById('modal-overlay');
  const modalImg = document.getElementById('modal-img');
  const modalTitle = document.getElementById('modal-title');
  const modalPrice = document.getElementById('modal-price');
  const modalHighlights = document.getElementById('modal-highlights');
  const modalDesc = document.getElementById('modal-desc');
  const modalSelectBtn = document.getElementById('modal-select-btn');
  const galleryPrev = document.getElementById('gallery-prev');
  const galleryNext = document.getElementById('gallery-next');
  const galleryDots = document.getElementById('gallery-dots');
  let modalChip = null;
  let galleryImages = [];
  let galleryIndex = 0;

  function renderGallery(){
    modalImg.src = galleryImages[galleryIndex] || '';
    const multi = galleryImages.length > 1;
    galleryPrev.hidden = !multi;
    galleryNext.hidden = !multi;
    galleryDots.innerHTML = '';
    if (multi){
      galleryImages.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'gallery-dot' + (i === galleryIndex ? ' active' : '');
        dot.setAttribute('aria-label', `Bild ${i + 1}`);
        dot.addEventListener('click', () => { galleryIndex = i; renderGallery(); });
        galleryDots.appendChild(dot);
      });
    }
  }

  function showPrevImage(){
    if (!galleryImages.length) return;
    galleryIndex = (galleryIndex - 1 + galleryImages.length) % galleryImages.length;
    renderGallery();
  }

  function showNextImage(){
    if (!galleryImages.length) return;
    galleryIndex = (galleryIndex + 1) % galleryImages.length;
    renderGallery();
  }

  function openModal(chip){
    modalChip = chip;
    const imagesAttr = chip.dataset.images;
    if (imagesAttr){
      galleryImages = imagesAttr.split('|').filter(Boolean);
    } else {
      const img = chip.querySelector('img');
      galleryImages = img ? [img.src] : [];
    }
    galleryIndex = 0;
    renderGallery();
    modalTitle.textContent = chip.dataset.name;
    const priceStr = chip.dataset.price;
    if (priceStr === ''){
      modalPrice.textContent = 'Preis auf Anfrage';
      modalPrice.classList.add('muted');
    } else {
      modalPrice.textContent = fmtEuro(parseFloat(priceStr));
      modalPrice.classList.remove('muted');
    }
    const highlightsAttr = chip.dataset.highlights;
    modalHighlights.innerHTML = '';
    const highlightItems = highlightsAttr ? highlightsAttr.split('|').filter(Boolean) : [];
    if (highlightItems.length){
      modalHighlights.style.display = 'flex';
      highlightItems.forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        modalHighlights.appendChild(li);
      });
    } else {
      modalHighlights.style.display = 'none';
    }
    modalDesc.textContent = chip.dataset.description || '';
    updateModalSelectBtn();
    modalOverlay.classList.add('open');
  }

  function updateModalSelectBtn(){
    if (!modalChip) return;
    const isSel = modalChip.classList.contains('selected');
    modalSelectBtn.textContent = isSel ? 'Ausgewählt — entfernen' : 'Zur Auswahl hinzufügen';
    modalSelectBtn.classList.toggle('is-selected', isSel);
  }

  function closeModal(){
    modalOverlay.classList.remove('open');
    modalChip = null;
  }

  document.querySelectorAll('.chip-info').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(btn.closest('.chip'));
    });
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  galleryPrev.addEventListener('click', showPrevImage);
  galleryNext.addEventListener('click', showNextImage);
  document.addEventListener('keydown', (e) => {
    if (!modalOverlay.classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') showPrevImage();
    if (e.key === 'ArrowRight') showNextImage();
  });
  modalSelectBtn.addEventListener('click', () => {
    if (!modalChip) return;
    modalChip.classList.toggle('selected');
    updateModalSelectBtn();
    render();
  });

  document.querySelectorAll('.chip[data-variants], .chip[data-accessories]').forEach(chip => {
    const variants = chip.dataset.variants ? JSON.parse(chip.dataset.variants) : null;
    const basePrice = parseFloat(chip.dataset.price);
    const baseName = chip.dataset.name;
    const priceEl = chip.querySelector('.price');
    const infoBtn = chip.querySelector('.chip-info');
    let select = null;
    if (variants){
      select = document.createElement('select');
      select.className = 'chip-variant-select';
      variants.forEach((v, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${v.label} — ${fmtEuro(v.price)}`;
        select.appendChild(opt);
      });
    }

    const colorOptions = chip.dataset.colorOptions ? chip.dataset.colorOptions.split('|').filter(Boolean) : null;
    let colorLabel = colorOptions ? colorOptions[0] : null;
    let colorSelect = null;
    if (colorOptions){
      colorSelect = document.createElement('select');
      colorSelect.className = 'chip-variant-select';
      colorOptions.forEach((c, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = c;
        colorSelect.appendChild(opt);
      });
    }

    const accessories = chip.dataset.accessories ? JSON.parse(chip.dataset.accessories) : null;
    const accessoryState = accessories ? accessories.map(() => ({ checked: false, variantIndex: 0 })) : null;
    let currentVariantIndex = 0;

    function applyVariant(i){
      currentVariantIndex = i;
      const v = variants ? variants[i] : { price: basePrice, source: null, label: null };
      const suffix = variants ? (colorLabel ? `${v.label}, ${colorLabel}` : v.label) : null;
      let name = suffix ? `${baseName} (${suffix})` : baseName;
      let price = v.price;
      if (accessories){
        const extras = [];
        accessories.forEach((acc, idx) => {
          const st = accessoryState[idx];
          let av;
          if (acc.variants) av = acc.variants[st.variantIndex];
          else if (acc.priceByVariant) av = { label: variants ? variants[currentVariantIndex].label : null, price: acc.priceByVariant[currentVariantIndex] };
          else av = { label: null, price: acc.price };
          if (acc._priceSpan) acc._priceSpan.textContent = fmtEuro(av.price);
          if (!st.checked) return;
          price += av.price;
          extras.push(av.label ? `${acc.name} (${av.label})` : acc.name);
        });
        if (extras.length) name += `, inkl. ${extras.join(', ')}`;
      }
      chip.dataset.name = name;
      chip.dataset.price = price;
      if (infoBtn && v.source) infoBtn.dataset.source = v.source;
      if (priceEl) priceEl.textContent = fmtEuro(price);
      if (modalChip === chip) openModal(chip);
    }
    if (select){
      select.addEventListener('click', e => e.stopPropagation());
      select.addEventListener('change', () => {
        applyVariant(Number(select.value));
        if (chip.classList.contains('selected')) render();
      });
      if (variants.length > 1) chip.querySelector('.chip-text').appendChild(select);
    }
    if (colorSelect){
      colorSelect.addEventListener('click', e => e.stopPropagation());
      colorSelect.addEventListener('change', () => {
        colorLabel = colorOptions[Number(colorSelect.value)];
        applyVariant(currentVariantIndex);
        if (chip.classList.contains('selected')) render();
      });
      chip.querySelector('.chip-text').appendChild(colorSelect);
    }

    if (accessories){
      chip.classList.add('has-accessories');
      const accWrap = document.createElement('div');
      accWrap.className = 'chip-accessories';
      accWrap.addEventListener('click', e => e.stopPropagation());
      const checkboxes = [];
      accessories.forEach((acc, idx) => {
        const st = accessoryState[idx];
        const row = document.createElement('label');
        row.className = 'chip-accessory';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        checkboxes.push(cb);
        const nameSpan = document.createElement('span');
        nameSpan.className = 'acc-name';
        nameSpan.textContent = '+ ' + acc.name;
        row.appendChild(cb);
        row.appendChild(nameSpan);
        if (acc.variants){
          const accSelect = document.createElement('select');
          accSelect.className = 'acc-variant-select';
          acc.variants.forEach((v, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `${v.label} — ${fmtEuro(v.price)}`;
            accSelect.appendChild(opt);
          });
          accSelect.addEventListener('click', e => e.stopPropagation());
          accSelect.addEventListener('change', () => {
            st.variantIndex = Number(accSelect.value);
            applyVariant(currentVariantIndex);
            if (chip.classList.contains('selected')) render();
          });
          row.appendChild(accSelect);
        } else {
          const priceSpan = document.createElement('span');
          priceSpan.className = 'acc-price';
          priceSpan.textContent = fmtEuro(acc.priceByVariant ? acc.priceByVariant[currentVariantIndex] : acc.price);
          row.appendChild(priceSpan);
          if (acc.priceByVariant) acc._priceSpan = priceSpan;
        }
        cb.addEventListener('change', () => {
          st.checked = cb.checked;
          if (cb.checked && !chip.classList.contains('selected')){
            chip.classList.add('selected');
          }
          applyVariant(currentVariantIndex);
          render();
        });
        accWrap.appendChild(row);
      });
      chip.appendChild(accWrap);
      chip._resetAccessories = () => {
        accessoryState.forEach(s => { s.checked = false; s.variantIndex = 0; });
        checkboxes.forEach(cb => cb.checked = false);
        applyVariant(currentVariantIndex);
      };
    }

    applyVariant(0);
  });

  function buildMailBody(){
  const {
 pkg, chips 
}
 = getSelection();
  let total = 0;
  let hasRequestItems = false;
  let body = 'Hallo Ventura-Team,\n\nich interessiere mich für folgende Konfiguration:\n\n';
  if (pkg){
  const price = parseFloat(pkg.dataset.price);
  total += price;
  body += `Basis: ${
pkg.dataset.name
}
 (${
fmtEuro(price)
}
)\n\n`;
  
}
  if (chips.length){
  body += 'Extras:\n';
  chips.forEach(chip => {
  const priceStr = chip.dataset.price;
  const qty = parseInt(chip.dataset.qty || '1', 10);
  const name = (qty > 1 ? qty + 'x ' : '') + chip.dataset.name;
  if (priceStr === ''){
  hasRequestItems = true;
  body += `- ${
name
}
 (auf Anfrage)\n`;

}
 else {
  const price = parseFloat(priceStr) * qty;
  total += price;
  body += `- ${
name
}
 (${
fmtEuro(price)
}
)\n`;

}

}
);
  body += '\n';
  
}
  const stilZeilen = stilLesen();
  if (stilZeilen && stilZeilen.length){
    const stilAufpreisMail = stilAufpreisSumme(stilZeilen);
    total += stilAufpreisMail;
    body += 'Gewählter Stil (Stil-Konfigurator):\n' + stilZeilen.map(z => '- ' + z.label + ': ' + z.wert).join('\n') + '\n\n';
    if (stilAufpreisMail) body += 'Aufpreise Stil gesamt: ' + fmtEuro(stilAufpreisMail) + '\n\n';
  }
  body += `Ungefähre Gesamtsumme: ${
fmtEuro(total)
}
${
hasRequestItems ? ' (zzgl. Positionen auf Anfrage)' : ''
}
 — unverbindlich.\n\n`;
  const notes = document.getElementById('notes-input').value.trim();
  if (notes){
  body += `Fragen/Ideen/Anmerkungen:\n${
notes
}
\n\n`;

}
  body += 'Bitte meldet euch mit einem konkreten Angebot und einem Terminvorschlag für ein kurzes Beratungsgespräch bei mir.\n\nViele Grüße';
  return body;

}
   document.getElementById('btn-send').addEventListener('click', () => {
  const subject = 'Angebotsanfrage - Ventura Caravans';
  const body = buildMailBody();
  window.location.href = `mailto:info@ventura-caravans.de?subject=${
encodeURIComponent(subject)
}
&body=${
encodeURIComponent(body)
}
`;

}
);


   document.getElementById('btn-callback').addEventListener('click', () => {
  document.getElementById('callback-hint').classList.add('show');

}
);
   document.getElementById('print-date').textContent = 'Stand: ' + new Date().toLocaleDateString('de-DE', {
 day: 'numeric', month: 'long', year: 'numeric'
}
);
   document.getElementById('notes-input').addEventListener('input', (e) => {
  document.getElementById('print-notes').textContent = e.target.value.trim();

}
);
  render();
  // ---------- Website-Kopfzeile: mobiles Menue ----------
  (function(){
    const toggle = document.getElementById('nav-toggle');
    const nav    = document.getElementById('main-nav');
    const header = document.querySelector('.site-header');
    if (!toggle || !nav || !header) return;

    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
    };
    syncHeaderHeight();
    window.addEventListener('resize', syncHeaderHeight);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncHeaderHeight);

    const closeNav = () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };
    toggle.addEventListener('click', () => {
      syncHeaderHeight();
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) closeNav(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 900 && nav.classList.contains('open')) closeNav(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) closeNav(); });
  })();


  // ================= Auswahl merken (localStorage) =================
  const SPEICHER = 'ventura-konfigurator-v1';

  function auswahlSpeichern(){
    try {
      const daten = {
        basis: document.querySelector('.model-card.selected')?.dataset.name || null,
        extras: Array.from(document.querySelectorAll('.chip.selected')).map(c => ({
          name: (c.querySelector('.chip-name')?.childNodes[0]?.textContent || '').trim(),
          qty: c.dataset.qty || '1',
          variante: c.querySelector('.chip-variant-select')?.value ?? null,
          farbe: c.querySelectorAll('.chip-variant-select')[1]?.value ?? null
        })),
        notiz: document.getElementById('notes-input')?.value || ''
      };
      localStorage.setItem(SPEICHER, JSON.stringify(daten));
    } catch(e) { /* z.B. privater Modus - dann eben ohne Speichern */ }
  }

  function auswahlLaden(){
    let daten;
    try { daten = JSON.parse(localStorage.getItem(SPEICHER) || 'null'); } catch(e) { return; }
    if (!daten) return;

    if (daten.basis){
      document.querySelectorAll('.model-card').forEach(c => {
        if (c.dataset.name === daten.basis) c.classList.add('selected');
      });
    }

    (daten.extras || []).forEach(e => {
      const chip = Array.from(document.querySelectorAll('.chip')).find(c =>
        (c.querySelector('.chip-name')?.childNodes[0]?.textContent || '').trim() === e.name);
      if (!chip) return;
      // Variante zuerst setzen, damit Preis/Name stimmen
      const selects = chip.querySelectorAll('.chip-variant-select');
      if (selects[0] && e.variante !== null && e.variante !== undefined){
        selects[0].value = e.variante;
        selects[0].dispatchEvent(new Event('change'));
      }
      if (selects[1] && e.farbe !== null && e.farbe !== undefined){
        selects[1].value = e.farbe;
        selects[1].dispatchEvent(new Event('change'));
      }
      chip.classList.add('selected');
      chip.dataset.qty = e.qty || '1';
      const qtyEl = chip.querySelector('.qty-value');
      if (qtyEl) qtyEl.textContent = chip.dataset.qty;
    });

    if (daten.notiz){
      const n = document.getElementById('notes-input');
      if (n){ n.value = daten.notiz; n.dispatchEvent(new Event('input')); }
    }
  }

  // Bei jeder Änderung sichern
  ['click','change','input'].forEach(evt =>
    document.addEventListener(evt, () => setTimeout(auswahlSpeichern, 0), true));

  // ================= PDF erzeugen =================
  function pdfErstellen(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const seiteB = 210, randL = 18, randR = 18, innen = seiteB - randL - randR;
    let y = 22;

    const gruen = [44, 63, 52], grau = [110, 110, 100], schwarz = [30, 36, 32];

    // Kopf
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...gruen);
    doc.text('VENTURA CARAVANS', seiteB/2, y, { align: 'center' });
    y += 8;
    doc.setFontSize(19); doc.setTextColor(...schwarz);
    doc.text('Konfigurator – Zusammenfassung', seiteB/2, y, { align: 'center' });
    y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...grau);
    doc.text('Stand: ' + new Date().toLocaleDateString('de-DE', { day:'numeric', month:'long', year:'numeric' }),
             seiteB/2, y, { align: 'center' });
    y += 5;
    doc.setDrawColor(...gruen); doc.setLineWidth(0.6);
    doc.line(randL, y, seiteB - randR, y);
    y += 9;

    // Positionen
    const { pkg, chips } = getSelection();
    let summe = 0;

    const zeile = (name, betrag, fett) => {
      if (y > 262){ doc.addPage(); y = 22; }
      doc.setFont('helvetica', fett ? 'bold' : 'normal');
      doc.setFontSize(fett ? 11 : 10);
      doc.setTextColor(...(fett ? gruen : schwarz));
      const nameZeilen = doc.splitTextToSize(name, innen - 32);
      doc.text(nameZeilen, randL, y);
      doc.text(betrag, seiteB - randR, y, { align: 'right' });
      y += nameZeilen.length * 5 + 3;
      doc.setDrawColor(216, 210, 196); doc.setLineWidth(0.2);
      doc.line(randL, y - 1.5, seiteB - randR, y - 1.5);
      y += 2;
    };

    if (pkg){
      const p = parseFloat(pkg.dataset.price);
      summe += p;
      zeile(pkg.dataset.name, fmtEuro(p), true);
    }
    chips.forEach(chip => {
      const anz = parseInt(chip.dataset.qty || '1', 10);
      const name = (anz > 1 ? anz + '× ' : '') + chip.dataset.name;
      const p = parseFloat(chip.dataset.price) * anz;
      summe += p;
      zeile(name, fmtEuro(p), false);
    });

    // Aufpreise aus Schritt 1 (Stil) gehören in die Gesamtsumme
    const stilPdf = stilLesen();
    const stilAufpreisPdf = stilAufpreisSumme(stilPdf);
    if (stilAufpreisPdf){
      summe += stilAufpreisPdf;
      zeile('Aufpreise Stil (Schritt 1)', fmtEuro(stilAufpreisPdf), false);
    }

    // Summe
    y += 3;
    if (y > 258){ doc.addPage(); y = 22; }
    doc.setDrawColor(...gruen); doc.setLineWidth(0.6);
    doc.line(randL, y, seiteB - randR, y);
    y += 7;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...schwarz);
    doc.text('Gesamt (ca.)', randL, y);
    doc.text(fmtEuro(summe), seiteB - randR, y, { align: 'right' });
    y += 10;

    // Stil aus Schritt 1
    if (stilPdf && stilPdf.length){
      if (y > 230){ doc.addPage(); y = 22; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...gruen);
      doc.text('EUER STIL', randL, y); y += 6;
      stilPdf.forEach(z => {
        if (y > 272){ doc.addPage(); y = 22; }
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...grau);
        doc.text(z.label, randL, y);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...schwarz);
        doc.text(doc.splitTextToSize(z.wert, innen - 50), seiteB - randR, y, { align: 'right' });
        y += 5.5;
      });
      y += 5;
    }

    // Anmerkungen
    const notiz = (document.getElementById('notes-input')?.value || '').trim();
    if (notiz){
      if (y > 240){ doc.addPage(); y = 22; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...gruen);
      doc.text('ANMERKUNGEN', randL, y); y += 5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...schwarz);
      const zeilen = doc.splitTextToSize(notiz, innen);
      zeilen.forEach(z => {
        if (y > 275){ doc.addPage(); y = 22; }
        doc.text(z, randL, y); y += 5;
      });
      y += 4;
    }

    // Fuß auf jeder Seite
    const seiten = doc.getNumberOfPages();
    for (let s = 1; s <= seiten; s++){
      doc.setPage(s);
      doc.setDrawColor(216, 210, 196); doc.setLineWidth(0.2);
      doc.line(randL, 282, seiteB - randR, 282);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...grau);
      doc.text('Unverbindliche Zusammenfassung · Alle Preise inkl. MwSt., vorbehaltlich Bestätigung durch den Hersteller', seiteB/2, 287, { align: 'center' });
      doc.text('Norman Katzorke — Ventura Caravans, Irxleben · info@ventura-caravans.de · Seite ' + s + ' von ' + seiten, seiteB/2, 291, { align: 'center' });
    }
    return doc;
  }

  const pdfDateiname = () =>
    'Ventura-Caravans-Konfiguration-' + new Date().toISOString().slice(0,10) + '.pdf';

  // PDF herunterladen (kein Druckdialog)
  document.getElementById('btn-print').addEventListener('click', () => {
    pdfErstellen().save(pdfDateiname());
  });

  // ================= WhatsApp: immer direkt in unseren Chat, PDF separat als Download =================
  document.getElementById('btn-whatsapp').addEventListener('click', () => {
    const text = buildMailBody();
    pdfErstellen().save(pdfDateiname());
    window.open('https://wa.me/4917656032460?text=' + encodeURIComponent(text), '_blank');
  });

  // Auswahl-Speicherung vorerst deaktiviert: bei jedem Laden zuruecksetzen statt wiederherzustellen
  try { localStorage.removeItem(SPEICHER); } catch(e) {}
  /* Modell per URL vorauswählen — die Buttons „Extras & Preis" auf neufahrzeuge.html
     verlinken auf neufahrzeug-konfigurator.html?modell=350d (bzw. 470k, 400c). */
  const modellWunsch = (new URLSearchParams(location.search).get('modell') || '').toLowerCase();
  if (modellWunsch){
    const karte = [...document.querySelectorAll('.model-card')]
      .find(c => (c.dataset.name || '').toLowerCase().replace(/[\s:]/g, '').includes(modellWunsch));
    if (karte && !karte.classList.contains('selected')) karte.click();
  }

  render();

})();
