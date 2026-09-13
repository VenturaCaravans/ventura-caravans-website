// Partner-Leiste: füllt jedes <div class="partner-leiste"> mit endlos durchlaufenden Logos.
// Partner nur hier pflegen. "h" = Anzeigehöhe in px, damit breite und kompakte Logos gleich stark wirken,
// "o" = optionale Deckkraft im Graumodus (Standard .62).
(function(){
  var PARTNER = [
    { name:'Fritz Berger',    datei:'fritz-berger.svg',    h:38 },
    { name:'LMC Caravan',     datei:'lmc.svg',             h:32 },
    { name:'Frankana Freiko', datei:'frankana-freiko.svg', h:19 },
    { name:'TROBOLO',         datei:'trobolo.svg',         h:28, o:.9 },
    { name:'Dometic',         datei:'dometic.svg',         h:20, o:.45 },
    { name:'Truma',           datei:'truma.svg',           h:38 },
    { name:'AL-KO',           datei:'al-ko.png',           h:34 }
  ];

  function gruppe(versteckt){
    var ul = document.createElement('ul');
    ul.className = 'partner-gruppe';
    if (versteckt) ul.setAttribute('aria-hidden', 'true');
    PARTNER.forEach(function(p){
      var li = document.createElement('li');
      var img = document.createElement('img');
      img.src = 'assets/partner/' + p.datei;
      img.alt = versteckt ? '' : p.name;
      img.style.height = p.h + 'px';
      if (p.o) img.style.setProperty('--grau', p.o); // Deckkraft im Graumodus, falls ein Logo zu hell/dunkel wirkt
      li.appendChild(img);
      ul.appendChild(li);
    });
    return ul;
  }

  document.querySelectorAll('.partner-leiste').forEach(function(leiste){
    var spur = document.createElement('div');
    spur.className = 'partner-spur';
    // Eine Hälfte muss breiter als der Bildschirm sein, sonst entsteht beim Durchlaufen eine Lücke.
    // Die zweite Hälfte ist eine exakte Kopie, die Animation verschiebt genau um 50 %.
    for (var haelfte = 0; haelfte < 2; haelfte++){
      for (var i = 0; i < 2; i++) spur.appendChild(gruppe(haelfte > 0 || i > 0));
    }
    leiste.appendChild(spur);
    // Gleichbleibendes Tempo (ca. 40 px/s), egal wie viele Partner in der Liste stehen
    function tempo(){ spur.style.animationDuration = Math.max(20, spur.scrollWidth / 2 / 40) + 's'; }
    tempo();
    window.addEventListener('load', tempo);
  });
})();
