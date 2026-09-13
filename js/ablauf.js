/* Schrittleiste für die geführten Abläufe. Die Schritte stehen NUR hier —
   neue Schritte (z. B. „Folierung" bei den Neufahrzeugen) einfach in ABLAEUFE eintragen.
   Einbindung pro Seite:
     <div class="ablauf-band"><div class="container">
       <nav class="ablauf" data-ablauf="refurbished" data-schritt="stil" aria-label="Ablauf"></nav>
     </div></div>
     <script src="js/ablauf.js"></script>
   data-schritt ist die id des aktuellen Schritts. */
(function () {
  'use strict';

  const ABLAEUFE = {
    refurbished: [
      { id: 'uebersicht', titel: 'Übersicht',         href: 'refurbished.html' },
      { id: 'stil',       titel: 'Stil gestalten',    href: 'stil-konfigurator.html', nr: 1 },
      { id: 'preis',      titel: 'Preis & Extras',    href: 'konfigurator.html',      nr: 2 }
    ],
    neu: [
      { id: 'uebersicht', titel: 'Übersicht',              href: 'neufahrzeuge.html' },
      // Folierung außen + Innenmaterialien — dieselbe Seite wie bei Refurbished, im Modus ?fahrzeug=neu
      { id: 'stil',       titel: 'Stil gestalten',         href: 'stil-konfigurator.html?fahrzeug=neu', nr: 1 },
      { id: 'preis',      titel: 'Modell, Extras & Preis', href: 'neufahrzeug-konfigurator.html',       nr: 2 }
    ]
  };

  document.querySelectorAll('nav.ablauf[data-ablauf]').forEach(nav => {
    const schritte = ABLAEUFE[nav.dataset.ablauf];
    if (!schritte) return;
    const aktuell = nav.dataset.schritt;
    const ol = document.createElement('ol');

    schritte.forEach(s => {
      const li = document.createElement('li');
      const nr = s.nr ? '<span class="ablauf-nr" aria-hidden="true">' + s.nr + '</span>' : '';
      const text = '<span>' + s.titel + '</span>';
      if (s.id === aktuell) {
        li.innerHTML = '<span class="ablauf-aktuell" aria-current="step">' + nr + text + '</span>';
      } else {
        li.innerHTML = '<a href="' + s.href + '">' + nr + text + '</a>';
      }
      ol.appendChild(li);
    });
    nav.appendChild(ol);
  });
})();
