/* Reims Talent · reimstalent.fr · v3 */
(() => {
  const racine = document.documentElement;
  racine.classList.remove("no-js");
  racine.classList.add("js");
  const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const survol = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const mobile = window.matchMedia("(max-width: 820px)").matches;

  // En-tête : un filet dès qu'on défile
  const entete = document.querySelector("[data-entete]");
  const majEntete = () => entete && entete.classList.toggle("est-collee", window.scrollY > 8);
  majEntete();
  window.addEventListener("scroll", majEntete, { passive: true });

  // Menu sur téléphone
  const burger = document.querySelector("[data-burger]");
  const nav = document.getElementById("nav");
  if (burger && nav) {
    const fermer = () => {
      nav.classList.remove("est-ouverte");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Ouvrir le menu");
      document.body.style.overflow = "";
    };
    burger.addEventListener("click", () => {
      const ouvert = nav.classList.toggle("est-ouverte");
      burger.setAttribute("aria-expanded", String(ouvert));
      burger.setAttribute("aria-label", ouvert ? "Fermer le menu" : "Ouvrir le menu");
      document.body.style.overflow = ouvert ? "hidden" : "";
    });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", fermer));
    document.addEventListener("keydown", (e) => e.key === "Escape" && fermer());
  }

  // Film d'accueil : paysage ou portrait selon l'écran
  const accueil = document.querySelector("[data-accueil]");
  if (accueil) {
    if (mobile) accueil.poster = accueil.dataset.posterMobile;
    if (!calme) {
      accueil.src = mobile ? accueil.dataset.srcMobile : accueil.dataset.srcLarge;
      accueil.play().catch(() => {});
    }
  }

  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".apparition").forEach((el) => el.classList.add("est-visible"));
  } else {
    // Apparitions au défilement
    const vu = new IntersectionObserver((entrees) => {
      entrees.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("est-visible"); vu.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".apparition").forEach((el) => vu.observe(el));

  }

  // Rubrique en cours, soulignée dans le menu : la dernière section passée sous le tiers de l'écran
  const liens = [...document.querySelectorAll("[data-lien]")];
  const sections = [...document.querySelectorAll("main section[id]")];
  let attente = false;
  const majMenu = () => {
    attente = false;
    const repere = window.innerHeight * 0.35;
    let courante = null;
    sections.forEach((s) => { if (s.getBoundingClientRect().top <= repere) courante = s.id; });
    liens.forEach((a) => a.classList.toggle("est-actif", a.getAttribute("href") === "#" + courante));
  };
  window.addEventListener("scroll", () => { if (!attente) { attente = true; setTimeout(majMenu, 60); } }, { passive: true });
  majMenu();

  // Extraits des portraits : au survol sur ordinateur, à l'écran sur téléphone
  const extraits = [...document.querySelectorAll("[data-carte]")];
  if (!calme && extraits.length) {
    if (survol) {
      extraits.forEach((v) => {
        const carte = v.closest(".carte");
        carte.addEventListener("mouseenter", () => { v.preload = "auto"; v.play().catch(() => {}); });
        carte.addEventListener("mouseleave", () => { v.pause(); });
      });
    } else if ("IntersectionObserver" in window) {
      const lecture = new IntersectionObserver((entrees) => {
        entrees.forEach((e) => {
          const v = e.target;
          if (e.isIntersecting) { v.preload = "auto"; v.play().catch(() => {}); } else { v.pause(); }
        });
      }, { threshold: 0.6 });
      extraits.forEach((v) => lecture.observe(v));
    }
  }

  // Son de l'accueil : jamais automatique, il monte et descend en douceur
  const son = document.querySelector("[data-son]");
  const piste = document.querySelector("[data-son-piste]");
  if (son && piste) {
    const libelle = son.querySelector("[data-son-libelle]");
    const texteOff = libelle.textContent;
    let rampe = null;
    const glisser = (cible, duree, fin) => {
      clearInterval(rampe);
      const depart = piste.volume, t0 = Date.now();
      rampe = setInterval(() => {
        const k = Math.min(1, (Date.now() - t0) / duree);
        piste.volume = depart + (cible - depart) * (1 - Math.cos(k * Math.PI)) / 2;
        if (k >= 1) { clearInterval(rampe); if (fin) fin(); }
      }, 30);
    };
    const couper = () => {
      son.setAttribute("aria-pressed", "false");
      libelle.textContent = texteOff;
      glisser(0, 700, () => piste.pause());
    };
    son.addEventListener("click", () => {
      if (son.getAttribute("aria-pressed") === "true") return couper();
      piste.volume = 0;
      piste.play().then(() => {
        son.setAttribute("aria-pressed", "true");
        libelle.textContent = "Couper le son";
        glisser(0.7, 1400);
      }).catch(() => {});
    });
    document.addEventListener("visibilitychange", () => { if (document.hidden && !piste.paused) couper(); });
  }

  // Questions : une seule réponse ouverte à la fois
  const questions = [...document.querySelectorAll(".faq details")];
  questions.forEach((d) => d.addEventListener("toggle", () => {
    if (d.open) questions.forEach((autre) => autre !== d && (autre.open = false));
  }));

  // Formulaires : envoi sans recharger la page
  document.querySelectorAll("[data-formulaire]").forEach((form) => {
    const etat = form.querySelector(".formulaire__etat");
    const dire = (texte, ok) => { etat.textContent = texte; etat.classList.toggle("est-ok", ok); etat.classList.toggle("est-erreur", !ok); };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let premier = null;
      form.querySelectorAll("[required]").forEach((champ) => {
        const valide = champ.type === "checkbox" ? champ.checked : champ.checkValidity() && champ.value.trim() !== "";
        champ.setAttribute("aria-invalid", valide ? "false" : "true");
        if (!valide && !premier) premier = champ;
      });
      if (premier) {
        dire(premier.type === "checkbox" ? "Cochez la case d'accord pour envoyer." : premier.type === "email" ? "Cette adresse e-mail ne semble pas valide." : "Merci de remplir les champs demandés.", false);
        premier.focus();
        return;
      }
      const bouton = form.querySelector("[type=submit]");
      bouton.disabled = true;
      dire("Envoi…", true);
      try {
        const rep = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        const json = await rep.json().catch(() => ({}));
        if (rep.ok && (json.ok || json.success)) {
          form.classList.add("est-envoye");
          dire(form.dataset.merci || "Merci, c'est bien reçu. On vous répond vite.", true);
        } else {
          dire("L'envoi n'a pas abouti. Réessayez, ou écrivez à contact@reimstalent.fr.", false);
          bouton.disabled = false;
        }
      } catch {
        dire("Pas de connexion. Réessayez, ou écrivez à contact@reimstalent.fr.", false);
        bouton.disabled = false;
      }
    });
  });
})();
