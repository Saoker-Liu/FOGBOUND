const chapterMenu = document.querySelector(".chapter-menu");
const menuSummary = chapterMenu.querySelector("summary");
const sections = document.querySelectorAll("[data-chapter]");
const navigationLinks = document.querySelectorAll('.journey a, .chapter-menu__links a');
const detail = document.querySelector("#card-detail");
const film = document.querySelector("#battle-video");
const filmPlay = document.querySelector(".film__play");

document.addEventListener("click", (event) => {
  if (chapterMenu.open && (!chapterMenu.contains(event.target) || event.target.closest("a"))) {
    chapterMenu.open = false;
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && chapterMenu.open) {
    chapterMenu.open = false;
    menuSummary.focus();
  }
});

film.controls = false;
filmPlay.hidden = false;
filmPlay.addEventListener("click", () => {
  const moveFocus = document.activeElement === filmPlay;
  film.controls = true;
  filmPlay.hidden = true;
  if (moveFocus) film.focus({ preventScroll: true });
  film.play().catch(() => {
    // If inline playback requires another gesture, the native controls are available.
  });
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) film.pause();
});

if (typeof detail.showModal === "function") {
  const image = document.querySelector("#card-image");
  const title = document.querySelector("#card-title");
  const theme = document.querySelector("#card-theme");
  const rule = document.querySelector("#card-rule");
  for (const link of document.querySelectorAll(".tactic")) {
    link.setAttribute("aria-haspopup", "dialog");
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      image.src = link.href;
      title.textContent = link.getAttribute("aria-label");
      theme.textContent = link.dataset.theme;
      rule.textContent = link.dataset.rule;
      film.pause();
      detail.showModal();
    });
  }
  detail.addEventListener("click", (event) => {
    if (event.target !== detail) return;
    const bounds = detail.getBoundingClientRect();
    const { clientX: x, clientY: y } = event;
    if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) {
      detail.close();
    }
  });
}

if ("IntersectionObserver" in window) {
  const visible = new Map();
  let activeChapter;
  const chapters = new IntersectionObserver((entries) => {
    for (const entry of entries) visible.set(entry.target.id, entry.intersectionRatio);
    let chapter;
    let ratio = .18;
    for (const [id, amount] of visible) {
      if (amount > ratio) {
        ratio = amount;
        chapter = id;
      }
    }
    if (chapter === activeChapter) return;
    activeChapter = chapter;
    for (const link of navigationLinks) {
      if (chapter && link.hash === "#" + chapter) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  }, { threshold: [0, .18, .32, .46, .6, .74, .88, 1] });
  for (const section of sections) chapters.observe(section);

  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const reveal = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("rise-in");
          reveal.unobserve(entry.target);
        }
      }
    }, { threshold: .1 });
    for (const block of document.querySelectorAll("[data-reveal]")) reveal.observe(block);
  }
}
