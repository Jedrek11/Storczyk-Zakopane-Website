const galleries = {
  'room-2os': [
    'zdj/gallery/slide-pokoj-poddasze.webp',
    'zdj/gallery/slide-pokoj-twin.webp',
  ],
  'room-23os': [
    'zdj/gallery/slide-pokoj-sofa.webp',
    'zdj/okolica/dekoracja-okno-choinka.jpg',
  ],
  'room-34os': [
    'zdj/gallery/slide-pokoj-drewniany.webp',
    'zdj/gallery/slide-pokoj-drewniany-2.webp',
    'zdj/gallery/slide-pokoj-twin-lampki.webp',
    'zdj/gallery/slide-sofa-pojedyncza.webp',
    'zdj/gallery/slide-pokoj-trojka.webp',
    'zdj/gallery/slide-lazienka.webp',
  ],
};

let currentGallery = [];
let currentIndex = 0;

function openLightbox(galleryId, startIndex) {
  currentGallery = galleries[galleryId];
  currentIndex = startIndex;
  showImage();
  document.getElementById('lb-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lb-overlay').classList.remove('active');
  document.body.style.overflow = '';
}



function lbPrev() {
  currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
  showImage();
}

function lbNext() {
  currentIndex = (currentIndex + 1) % currentGallery.length;
  showImage();
}

let currentScale = 1, pinchStartDist = 0, pinchLastScale = 1;

document.addEventListener('DOMContentLoaded', () => {
  // Populate galeria gallery from DOM
  const galleryImgs = document.querySelectorAll('.gallery-grid img');
  galleries['galeria'] = Array.from(galleryImgs).map(img => img.src || img.dataset.src);
  galleryImgs.forEach((img, i) => {
    img.addEventListener('click', () => openLightbox('galeria', i));
  });

  const overlay = document.getElementById('lb-overlay');
  const lbImg = document.getElementById('lb-main-img');

  overlay.addEventListener('click', function(e) {
    if (e.target === this) {
      // lewa połowa = poprzednie, prawa = następne, nigdy nie zamyka
      if (e.clientX < window.innerWidth / 2) lbPrev();
      else lbNext();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('active')) return;
    if (e.key === 'ArrowRight') lbNext();
    if (e.key === 'ArrowLeft') lbPrev();
    if (e.key === 'Escape') closeLightbox();
  });

  // Swipe navigation
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
  overlay.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }
  }, {passive: true});
  overlay.addEventListener('touchend', (e) => {
    if (currentScale > 1.05) return; // don't swipe when zoomed
    if (e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const dt = Date.now() - touchStartTime;
      if (dt < 400 && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 45) {
        if (dx < 0) lbNext(); else lbPrev();
      }
    }
  }, {passive: true});

  // Pinch-to-zoom
  lbImg.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      pinchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchLastScale = currentScale;
    }
  }, {passive: false});
  lbImg.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      currentScale = Math.min(4, Math.max(1, pinchLastScale * (dist / pinchStartDist)));
      lbImg.style.transform = 'scale(' + currentScale + ')';
    }
  }, {passive: false});
  lbImg.addEventListener('touchend', (e) => {
    if (currentScale < 1.08) {
      currentScale = 1;
      lbImg.style.transform = '';
    }
  }, {passive: true});
});


function showImage() {
  const img = document.getElementById('lb-main-img');
  currentScale = 1;
  img.style.transform = '';
  img.classList.add('lb-img-fade');
  setTimeout(() => {
    img.src = currentGallery[currentIndex];
    img.onload = () => { img.classList.remove('lb-img-fade'); };
  }, 200);
  document.getElementById('lb-counter').textContent = (currentIndex+1) + ' / ' + currentGallery.length;
  const thumbsContainer = document.getElementById('lb-dots');
  thumbsContainer.innerHTML = '';
  currentGallery.forEach((src, i) => {
    const thumb = document.createElement('img');
    thumb.src = src;
    thumb.className = 'lb-thumb' + (i === currentIndex ? ' active' : '');
    thumb.onclick = () => { currentIndex = i; showImage(); };
    thumbsContainer.appendChild(thumb);
  });
  // Scroll aktywnej miniaturki do widoku
  var activeThumb = thumbsContainer.querySelector('.lb-thumb.active');
  if (activeThumb) {
    activeThumb.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }
}

function toggleDistances(btn) {
  const hidden = document.querySelectorAll('.dist-hidden');
  const isOpen = btn.classList.contains('open');
  hidden.forEach(el => el.classList.toggle('visible', !isOpen));
  btn.classList.toggle('open', !isOpen);
  btn.querySelector('span').textContent = isOpen ? 'Pokaż więcej' : 'Pokaż mniej';
}

(function() {
  var slides = [
    'zdj/gallery/slide-panorama-tatry.webp',
    'zdj/gallery/slide-willa-dach.webp',
    'zdj/gallery/slide-ogrod-jelen.webp'
  ];
  var current = 0;
  var slideshowTimer;

  function startSlideshow() {
    var img = document.getElementById('about-slideshow');
    if (!img || !slides.length) return;

    slideshowTimer = setInterval(function() {
      img.style.opacity = '0';
      setTimeout(function() {
        current = (current + 1) % slides.length;
        img.src = slides[current];
        img.style.opacity = '1';
      }, 900);
    }, 6000);
  }

  document.addEventListener('DOMContentLoaded', startSlideshow);
  window.addEventListener('unload', function() { clearInterval(slideshowTimer); });
})();

function toggleMenu() {
  var menu = document.getElementById('mobile-menu');
  var hamburger = document.getElementById('hamburger');
  if (menu.classList.contains('open')) {
    closeMenu();
  } else {
    menu.classList.add('open');
    hamburger.classList.add('open');
  }
}
function closeMenu() {
  var menu = document.getElementById('mobile-menu');
  var hamburger = document.getElementById('hamburger');
  menu.classList.remove('open');
  hamburger.classList.remove('open');
}

// Bottom nav active state — page default always stays, Menu toggles separately
(function() {
  var menuBtn = document.querySelector('.bottom-nav button');
  if (menuBtn) {
    var origToggle = window.toggleMenu;
    window.toggleMenu = function() {
      var menu = document.getElementById('mobile-menu');
      var wasOpen = menu.classList.contains('open');
      origToggle();
      if (wasOpen) {
        menuBtn.classList.remove('bnav-active');
      } else {
        menuBtn.classList.add('bnav-active');
      }
    };
    var origClose = window.closeMenu;
    window.closeMenu = function() {
      origClose();
      menuBtn.classList.remove('bnav-active');
    };
  }
})();

// Close menu when clicking overlay area
document.getElementById('mobile-menu').addEventListener('click', function(e) {
  if (e.target === this) closeMenu();
});

function toggleFaq(btn) {
  var answer = btn.nextElementSibling;
  var isOpen = btn.classList.contains("open");
  document.querySelectorAll(".faq-q").forEach(function(b) {
    b.classList.remove("open");
    b.nextElementSibling.classList.remove("open");
  });
  if (!isOpen) {
    btn.classList.add("open");
    answer.classList.add("open");
  }
}

(function() {
  var carousel = document.getElementById('badges-carousel');
  if (!carousel) return;
  var items = carousel.querySelectorAll('.badge-item');
  var dotsEl = document.getElementById('badge-dots');
  var dots = dotsEl ? dotsEl.querySelectorAll('.badge-dot') : [];
  var current = 0;
  var timer;

  function showSlide(n) {
    items[current].classList.remove('active');
    if (dots[current]) dots[current].classList.remove('active');
    current = ((n % items.length) + items.length) % items.length;
    items[current].classList.add('active');
    if (dots[current]) dots[current].classList.add('active');
  }

  showSlide(0);

  Array.prototype.forEach.call(dots, function(dot, idx) {
    dot.addEventListener('click', function() {
      clearInterval(timer);
      showSlide(idx);
      timer = setInterval(function() { showSlide(current + 1); }, 2800);
    });
  });

  timer = setInterval(function() { showSlide(current + 1); }, 2800);
})();

// Nav scroll effect
(function(){
  var nav = document.querySelector('nav');
  if(!nav) return;
  window.addEventListener('scroll', function(){
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;
    if(scrollY > 60) nav.classList.add('nav-scrolled');
    else nav.classList.remove('nav-scrolled');
  }, {passive:true});
})();

(function(){
  var floatPhoneBtn = document.querySelector('.float-phone');
  var lokalizacja = document.getElementById('lokalizacja');
  var formularz = document.getElementById('formularz');
  var kontakt = document.getElementById('kontakt');
  function checkPhone(){
    if(!floatPhoneBtn || !lokalizacja) return;
    var showFrom = lokalizacja.offsetTop;
    // Przycisk znika, gdy formularz zaczyna wchodzic w kadr - inaczej pływałby
    // nad wlasnym celem i zaslanial przycisk wysylki.
    var hideFrom = Infinity;
    if(formularz){
      hideFrom = formularz.getBoundingClientRect().top + window.scrollY - window.innerHeight + 140;
    } else if(kontakt){
      hideFrom = kontakt.offsetTop;
    }
    if(window.scrollY < showFrom || window.scrollY >= hideFrom){
      floatPhoneBtn.classList.add('float-phone--hidden');
    } else {
      floatPhoneBtn.classList.remove('float-phone--hidden');
    }
  }
  window.addEventListener('scroll', checkPhone, {passive:true});
  window.addEventListener('load', checkPhone);

  // Glow button every 30s
  (function(){
    var glowTimer;
    function triggerGlow(){
      var rezBtn = document.querySelector('.btn-rez');
      if(!rezBtn) return;
      rezBtn.classList.remove('glow');
      void rezBtn.offsetWidth; // reflow
      rezBtn.classList.add('glow');
      rezBtn.addEventListener('animationend', function(){ rezBtn.classList.remove('glow'); }, {once:true});
    }
    setTimeout(function(){ triggerGlow(); glowTimer = setInterval(triggerGlow, 30000); }, 30000);
    window.addEventListener('unload', function() { clearInterval(glowTimer); });
  })();

  // Typewriter – Twoje [słowo]
  (function(){
    var typewriterEl = document.getElementById('typewriter');
    if(!typewriterEl) return;

    var words = ['wytchnienie', 'miejsce', 'schronienie', 'zacisze'];
    var wordIndex = 2; // start at 'schronienie'
    var currentWord = 'schronienie';
    var charIndex = currentWord.length;

    function sleep(ms){ return new Promise(function(resolve){ setTimeout(resolve, ms); }); }

    async function cycleTypewriterWords(){
      await sleep(2200);

      while(true){
        // Kasuj aktualne slowo
        while(charIndex > 0){
          charIndex--;
          typewriterEl.textContent = currentWord.slice(0, charIndex);
          await sleep(55);
        }

        await sleep(250);
        wordIndex = (wordIndex + 1) % words.length;
        currentWord = words[wordIndex];

        // Pisz nowe slowo
        while(charIndex < currentWord.length){
          charIndex++;
          typewriterEl.textContent = currentWord.slice(0, charIndex);
          await sleep(85);
        }

        await sleep(5000);
      }
    }

    cycleTypewriterWords();
  })();

  // Formularz kontaktowy – Netlify Forms (AJAX)
  (function(){
    var form = document.getElementById('booking-form');
    if(!form) return;
    var nameInput = document.getElementById('imie');
    var emailInput = document.getElementById('email');
    var arrivalInput = document.getElementById('przyjazd');
    var departureInput = document.getElementById('wyjazd');
    var peopleSelect = document.getElementById('osoby');
    var messageInput = document.getElementById('wiadomosc');
    var successMsg = document.getElementById('form-success');
    var errorMsg = document.getElementById('form-error');
    var captchaWrapper = form.querySelector('[data-netlify-recaptcha="true"]');

    function showError(message){
      errorMsg.textContent = message;
      errorMsg.style.display = 'block';
      successMsg.style.display = 'none';
    }

    function setCaptchaErrorState(isError){
      if(!captchaWrapper) return;
      captchaWrapper.style.border = isError ? '1px solid rgba(224, 128, 128, 0.95)' : '';
      captchaWrapper.style.borderRadius = isError ? '8px' : '';
      captchaWrapper.style.padding = isError ? '0.35rem' : '';
    }

    // Sprawdzamy captche tylko wtedy, gdy faktycznie jest na stronie.
    // Wczesniej funkcja zwracala false przy braku widgetu i blokowala
    // kazde wyslanie komunikatem "Zaznacz Nie jestem robotem", mimo ze
    // takiego pola nigdzie nie bylo. Przed spamem chroni honeypot bot-field.
    function isRecaptchaVerified(){
      var tokenField = form.querySelector('textarea[name="g-recaptcha-response"], input[name="g-recaptcha-response"]');
      var maGrecaptcha = typeof grecaptcha !== 'undefined' && typeof grecaptcha.getResponse === 'function';
      if(!captchaWrapper && !tokenField && !maGrecaptcha) return true;

      if(tokenField && tokenField.value && tokenField.value.trim()){
        return true;
      }
      if(maGrecaptcha){
        try {
          var response = grecaptcha.getResponse();
          return !!(response && response.trim());
        } catch (_) {
          return false;
        }
      }
      return false;
    }

    if(arrivalInput && departureInput){
      arrivalInput.addEventListener('change', function(){
        if(arrivalInput.value){
          departureInput.min = arrivalInput.value;
          if(departureInput.value && departureInput.value < arrivalInput.value){
            departureInput.value = '';
          }
        } else {
          departureInput.min = '';
        }
      });
    }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      successMsg.style.display = 'none';
      errorMsg.style.display = 'none';
      setCaptchaErrorState(false);

      if(!nameInput.value.trim()){
        showError('Podaj imię i nazwisko.');
        return;
      }
      if(!emailInput.value.trim()){
        showError('Podaj adres e-mail.');
        return;
      }
      if(!emailInput.checkValidity()){
        showError('Podaj poprawny adres e-mail.');
        return;
      }
      if(!arrivalInput.value){
        showError('Wybierz termin przyjazdu.');
        return;
      }
      if(!departureInput.value){
        showError('Wybierz termin wyjazdu.');
        return;
      }
      if(!peopleSelect.value){
        showError('Wybierz liczbę osób.');
        return;
      }
      // Wiadomosc jest opcjonalna – zeby zapytac o wolny termin nie trzeba
      // niczego komponowac. Jesli Gosc cos wpisze, pilnujemy sensownej dlugosci.
      var trescWiadomosci = messageInput.value.trim();
      if(trescWiadomosci.length > 0 && trescWiadomosci.length < 10){
        showError('Wiadomość jest za krótka. Napisz kilka słów albo zostaw pole puste.');
        return;
      }
      if(departureInput.value < arrivalInput.value){
        showError('Termin wyjazdu nie może być wcześniejszy niż termin przyjazdu.');
        return;
      }
      if(!isRecaptchaVerified()){
        setCaptchaErrorState(true);
        showError('Zaznacz "Nie jestem robotem". Bez tego formularz nie zostanie wysłany.');
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Wysyłanie…';
      fetch('/', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function(odpowiedz){
        // fetch odrzuca obietnice TYLKO przy bledzie sieci. Odpowiedz 404 albo
        // 500 (np. gdyby Netlify przestal rozpoznawac formularz) wchodzi tutaj
        // jako sukces. Bez tego sprawdzenia Gosc widzialby "Dziekujemy",
        // mimo ze zapytanie nigdzie nie dotarlo.
        if (!odpowiedz || odpowiedz.ok === false) {
          throw new Error('Serwer odrzucil formularz, status ' + (odpowiedz && odpowiedz.status));
        }
        form.reset();
        departureInput.min = '';
        successMsg.style.display = 'block';
        errorMsg.style.display = 'none';
        submitBtn.style.display = 'none';
      }).catch(function(){
        // Nie czyscimy pol - Gosc ma miec co wyslac ponownie.
        // main.js nie przechodzi przez build.js, wiec numer wpisany na sztywno
        showError('Nie udało się wysłać zapytania. Zadzwoń: 607 312 972 lub napisz na WhatsAppa.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Wyślij zapytanie';
      });
    });
  })();

  // Dzwonienie ikonki telefonu co 4 sekundy
  (function(){
    var ringTimer;
    function triggerRing(){
      var navPhoneBtn = document.querySelector('.nav-phone');
      if(!navPhoneBtn) return;
      navPhoneBtn.classList.add('ringing');
      setTimeout(function(){ navPhoneBtn.classList.remove('ringing'); }, 800);
    }
    setTimeout(function(){ triggerRing(); ringTimer = setInterval(triggerRing, 4000); }, 2000);
    window.addEventListener('unload', function() { clearInterval(ringTimer); });
  })();

  // Attract animation na przycisku Zarezerwuj – co 5 sekund
  (function(){
    var attractTimer;
    function triggerAttract(){
      var floatBtn = document.querySelector('.float-phone');
      if(!floatBtn || floatBtn.classList.contains('float-phone--hidden')) return;
      floatBtn.classList.remove('attract');
      void floatBtn.offsetWidth;
      floatBtn.classList.add('attract');
      floatBtn.addEventListener('animationend', function(){ floatBtn.classList.remove('attract'); }, {once:true});
    }
    setTimeout(function(){ triggerAttract(); attractTimer = setInterval(triggerAttract, 5000); }, 4000);
    window.addEventListener('unload', function() { clearInterval(attractTimer); });
  })();

  checkPhone();
})();

(function() {
  // Zgoda UPRZEDNIA (RODO): usługi zewnętrzne (TikTok, mapa Google) NIE ładują się,
  // dopóki użytkownik nie kliknie "Akceptuję". Do tego czasu widoczne są placeholdery.
  var consent = localStorage.getItem('cookie-consent');

  function loadThirdParty() {
    // Iframy wstrzymane do zgody (src trzymany w data-consent-src)
    document.querySelectorAll('iframe[data-consent-src]').forEach(function(f) {
      f.src = f.getAttribute('data-consent-src');
    });
    // Skrypt TikTok — wstrzykiwany dopiero teraz
    if (document.querySelector('.tiktok-embed') && !document.querySelector('script[src*="tiktok.com/embed"]')) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.tiktok.com/embed.js';
      document.body.appendChild(s);
    }
  }

  if (consent === 'accepted') {
    loadThirdParty();
  } else {
    // Brak decyzji lub odrzucono — pokaż placeholdery zamiast treści zewnętrznych
    blockTikTok();
    blockMaps();
    if (!consent) {
      // Pokaż banner po krótkim opóźnieniu
      setTimeout(function() {
        var banner = document.getElementById('cookie-banner');
        if (!banner) return;
        banner.style.display = 'block';
        if (window.innerWidth <= 768) {
          banner.style.bottom = 'calc(4.5rem + env(safe-area-inset-bottom, 0px))';
          banner.style.borderRadius = '16px';
          banner.style.margin = '0 0.6rem';
          banner.style.left = '0';
          banner.style.right = '0';
        }
      }, 800);
    }
  }

  window.acceptCookies = function() {
    localStorage.setItem('cookie-consent', 'accepted');
    var banner = document.getElementById('cookie-banner');
    if (banner) banner.style.display = 'none';
    // Przeładowanie czyści placeholdery i ładuje mapę + TikTok
    location.reload();
  };

  window.rejectCookies = function() {
    localStorage.setItem('cookie-consent', 'rejected');
    var banner = document.getElementById('cookie-banner');
    if (banner) banner.style.display = 'none';
  };

  function blockMaps() {
    // Placeholder w miejscu mapy (iframe bez src nic nie ładuje)
    document.querySelectorAll('iframe[data-consent-src]').forEach(function(f) {
      if (f.parentNode.querySelector('.consent-map-placeholder')) return;
      var box = document.createElement('div');
      box.className = 'consent-map-placeholder';
      box.style.cssText = 'display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.5rem; min-height:280px; height:100%; padding:2rem 1.5rem; text-align:center; color:#888; font-size:0.85rem; line-height:1.6; background:rgba(0,0,0,0.04); border-radius:inherit;';
      var p1 = document.createElement('p');
      p1.style.cssText = 'margin:0;';
      p1.textContent = '🗺️ Mapa Google zablokowana';
      var p2 = document.createElement('p');
      p2.style.cssText = 'margin:0; font-size:0.78rem;';
      p2.textContent = 'Zaakceptuj pliki cookies, aby wyświetlić mapę dojazdu.';
      var btn = document.createElement('button');
      btn.style.cssText = 'margin-top:0.4rem; background:var(--mauve-light, #2c4a2c); color:white; border:none; padding:0.45rem 1.1rem; border-radius:4px; font-size:0.75rem; font-weight:700; cursor:pointer;';
      btn.textContent = 'Włącz mapę';
      btn.addEventListener('click', function() { acceptCookies(); });
      box.appendChild(p1); box.appendChild(p2); box.appendChild(btn);
      f.style.display = 'none';
      f.parentNode.insertBefore(box, f);
    });
  }

  function blockTikTok() {
    // Usuń TikTok embed script
    var ttScript = document.querySelector('script[src*="tiktok.com/embed"]');
    if (ttScript) ttScript.remove();
    // Zastąp TikTok embedy komunikatem (bezpieczne tworzenie DOM)
    var embeds = document.querySelectorAll('.tiktok-embed');
    embeds.forEach(function(embed) {
      embed.textContent = '';
      var container = document.createElement('div');
      container.style.cssText = 'padding:3rem 1.5rem; text-align:center; color:#888; font-size:0.85rem; line-height:1.6;';
      var p1 = document.createElement('p');
      p1.style.cssText = 'margin:0 0 0.5rem;';
      p1.textContent = '\uD83C\uDFAC Treść TikTok zablokowana';
      var p2 = document.createElement('p');
      p2.style.cssText = 'margin:0; font-size:0.78rem;';
      p2.textContent = 'Zaakceptuj pliki cookies, aby wyświetlić filmy.';
      var btn = document.createElement('button');
      btn.style.cssText = 'margin-top:0.8rem; background:var(--mauve-light); color:white; border:none; padding:0.4rem 1rem; border-radius:4px; font-size:0.75rem; font-weight:700; cursor:pointer;';
      btn.textContent = 'Włącz cookies';
      btn.addEventListener('click', function() { acceptCookies(); });
      container.appendChild(p1);
      container.appendChild(p2);
      container.appendChild(btn);
      embed.appendChild(container);
    });
  }
})();

/* polish-typography-nbsp */
(function () {
  function applyPolishTypography(root) {
    if (!root || !window.NodeFilter) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node || !node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('script, style, textarea, input, select, option, code, pre, kbd, samp, .tiktok-embed, .tiktok-embed *, .tiktok-link-btn')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach(function (node) {
      var original = node.nodeValue;
      var updated = original
        .replace(/(^|[\s\u00A0])([AaIiOoUuWwZz])\s+(?=\S)/g, '$1$2\u00A0')
        .replace(/(^|[\s\u00A0])(np|itd|itp|m\.in)\.\s+(?=\S)/gi, '$1$2.\u00A0');

      if (updated !== original) node.nodeValue = updated;
    });
  }

  function initPolishTypography() {
    applyPolishTypography(document.body);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPolishTypography, { once: true });
  } else {
    initPolishTypography();
  }
})();

/* ── Reveal-on-scroll (Intersection Observer) ── */
(function() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('[data-reveal]').forEach(function(el) {
      el.classList.add('revealed');
    });
    return;
  }

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
  });

  document.querySelectorAll('[data-reveal]').forEach(function(el) {
    observer.observe(el);
  });
})();

/* ── Hero subtle parallax ── */
(function() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var hero = document.querySelector('.hero');
  var heroVideo = document.querySelector('.hero-video');
  var heroBg = document.querySelector('.hero-bg');
  if (!hero) return;
  var heroH = hero.offsetHeight;

  window.addEventListener('scroll', function() {
    var scrollY = window.pageYOffset;
    if (scrollY > heroH) return;
    var offset = scrollY * 0.25;
    if (heroVideo) heroVideo.style.transform = 'translate3d(0,' + offset + 'px,0)';
    if (heroBg) heroBg.style.transform = 'translate3d(0,' + offset + 'px,0)';
  }, { passive: true });
})();
/* hero-video-lazy: wideo hero (2.6 MB) dogrywane PO załadowaniu strony i tylko na mobile.
   Desktop pokazuje tło-obrazek (wideo ukryte w CSS), więc nie pobiera filmu wcale.
   Do czasu dogrania widoczny jest poster — znacząco poprawia LCP i wagę strony. */
(function () {
  var video = document.querySelector('.hero-video');
  if (!video) return;
  var source = video.querySelector('source[data-src]');
  if (!source) return;

  function loadHeroVideo() {
    if (!window.matchMedia('(max-width: 768px)').matches) return; // desktop: obrazek, nie film
    if (source.src) return; // już dograne
    video.autoplay = true; // po dograniu zachowuje się jak oryginalny autoplay (muted+playsinline)
    source.src = source.getAttribute('data-src');
    video.load();
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay zablokowany — zostaje poster */ });
  }

  // Pas bezpieczeństwa: pierwszy dotyk/scroll ponawia odtwarzanie, gdyby przeglądarka zablokowała
  function kickPlay() {
    if (source.src && video.paused) {
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }
  }
  document.addEventListener('touchstart', kickPlay, { once: true, passive: true });
  window.addEventListener('scroll', kickPlay, { once: true, passive: true });

  if (document.readyState === 'complete') {
    loadHeroVideo();
  } else {
    window.addEventListener('load', function () {
      // krótki oddech po load, żeby nie konkurować z niczym
      setTimeout(loadHeroVideo, 200);
    });
  }
  // Obrót telefonu / zmiana szerokości okna → dograj jeśli trzeba
  window.addEventListener('resize', loadHeroVideo, { passive: true });
})();
