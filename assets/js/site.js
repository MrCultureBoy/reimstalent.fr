/* Reims Talent · reimstalent.fr */
(() => {
  document.documentElement.classList.remove("no-js");
  const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // En-tête : fond plein dès qu'on défile
  const entete = document.querySelector("[data-entete]");
  const majEntete = () => entete && entete.classList.toggle("est-collee", window.scrollY > 40);
  majEntete();
  window.addEventListener("scroll", majEntete, { passive: true });

  // Menu sur téléphone
  const burger = document.querySelector("[data-burger]");
  const nav = document.getElementById("nav");
  if (burger && nav) {
    const fermer = () => { nav.classList.remove("est-ouverte"); burger.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; };
    burger.addEventListener("click", () => {
      const ouvert = nav.classList.toggle("est-ouverte");
      burger.setAttribute("aria-expanded", String(ouvert));
      burger.setAttribute("aria-label", ouvert ? "Fermer le menu" : "Ouvrir le menu");
      document.body.style.overflow = ouvert ? "hidden" : "";
    });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", fermer));
    document.addEventListener("keydown", (e) => e.key === "Escape" && fermer());
  }

  // Vidéo d'accueil : version paysage ou portrait selon l'écran
  const accueil = document.querySelector("[data-accueil]");
  if (accueil && !calme) {
    const mobile = window.matchMedia("(max-width: 820px)").matches;
    if (mobile) accueil.poster = accueil.dataset.posterMobile;
    accueil.src = mobile ? accueil.dataset.srcMobile : accueil.dataset.srcLarge;
    accueil.play().catch(() => {});
  } else if (accueil && window.matchMedia("(max-width: 820px)").matches) {
    accueil.poster = accueil.dataset.posterMobile;
  }

  // Apparitions au défilement + extraits des cartes joués seulement à l'écran
  if ("IntersectionObserver" in window) {
    const vu = new IntersectionObserver((entrees) => {
      entrees.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("est-visible"); vu.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".apparition").forEach((el) => vu.observe(el));

    if (!calme) {
      const lecture = new IntersectionObserver((entrees) => {
        entrees.forEach((e) => {
          const v = e.target;
          if (e.isIntersecting) { v.preload = "auto"; v.play().catch(() => {}); } else { v.pause(); }
        });
      }, { threshold: 0.35 });
      document.querySelectorAll("[data-carte]").forEach((v) => lecture.observe(v));
    }
  } else {
    document.querySelectorAll(".apparition").forEach((el) => el.classList.add("est-visible"));
  }

  // Formulaires : envoi sans recharger la page
  document.querySelectorAll("[data-horloge]").forEach((h) => (h.value = String(Date.now())));
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
