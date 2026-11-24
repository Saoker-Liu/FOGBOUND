const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const battleVideo = document.querySelector("#battle-video");
const cardDetail = document.querySelector("#card-detail");
let battleVisible = false;
let previewPending = true;

function syncBattleVideo() {
  if (!battleVisible || document.hidden || cardDetail.open) {
    if (!battleVideo.paused) {
      previewPending = battleVideo.muted;
      battleVideo.pause();
    }
  } else if (previewPending && !reducedMotion.matches) {
    previewPending = false;
    battleVideo.play().catch(() => {
      // The poster and native controls cover browsers that require a gesture.
    });
  }
}

document.addEventListener("visibilitychange", syncBattleVideo);
reducedMotion.addEventListener("change", ({ matches }) => {
  if (matches && battleVideo.muted) battleVideo.pause();
  if (!matches) syncBattleVideo();
});

if ("IntersectionObserver" in window) {
  const mediaObserver = new IntersectionObserver(([entry]) => {
    battleVisible = entry.intersectionRatio >= 0.25;
    syncBattleVideo();
  }, { threshold: 0.25 });
  mediaObserver.observe(battleVideo);

  if (!reducedMotion.matches) {
    const revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.remove("reveal-pending");
          entry.target.classList.add("reveal-in");
          revealObserver.unobserve(entry.target);
        }
      }
    }, { threshold: 0.05 });
    for (const section of document.querySelectorAll("[data-reveal]")) {
      section.classList.add("reveal-pending");
      revealObserver.observe(section);
    }
  }
}

function bindTabs(tablist, select) {
  const tabs = [...tablist.querySelectorAll("[role=tab]")];
  const panel = document.getElementById(tabs[0].getAttribute("aria-controls"));

  function activate(tab) {
    if (tab.getAttribute("aria-selected") === "true") return;
    for (const item of tabs) {
      item.setAttribute("aria-selected", String(item === tab));
      item.tabIndex = item === tab ? 0 : -1;
    }
    panel.setAttribute("aria-labelledby", tab.id);
    select(tab);
  }

  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener("click", () => activate(tab));
    tab.addEventListener("keydown", (event) => {
      let target;
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          target = (index + 1) % tabs.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          target = (index + tabs.length - 1) % tabs.length;
          break;
        case "Home":
          target = 0;
          break;
        case "End":
          target = tabs.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      tabs[target].focus();
      activate(tabs[target]);
    });
  }
}

const chapterTabs = document.querySelector("#chapter-tabs");
const chapterArt = document.querySelector("#chapter-art");
const chapterLabel = document.querySelector("#chapter-label");
const chapterTitle = document.querySelector("#chapter-title");
const chapterCaption = document.querySelector("#chapter-caption");
const wide = matchMedia("(min-width: 981px)");

function updateTabOrientation() {
  chapterTabs.setAttribute("aria-orientation", wide.matches ? "vertical" : "horizontal");
}

wide.addEventListener("change", updateTabOrientation);
updateTabOrientation();

bindTabs(chapterTabs, (tab) => {
  chapterArt.classList.remove("swap-in");
  chapterArt.src = "media/" + tab.dataset.art + ".webp";
  chapterLabel.textContent = tab.querySelector(".atlas__label").textContent;
  chapterTitle.textContent = tab.querySelector("strong").textContent;
  chapterCaption.textContent = tab.dataset.caption;
});
chapterArt.addEventListener("load", () => chapterArt.classList.add("swap-in"));

const deckFilters = document.querySelector(".deck-filters");
const filterButtons = deckFilters.querySelectorAll(".deck-filter");
const deckSummary = document.querySelector("#deck-summary");
const cardSlots = document.querySelectorAll("#deck-grid > li");
for (const button of filterButtons) {
  button.addEventListener("click", () => {
    const { group, summary } = button.dataset;
    for (const filter of filterButtons) {
      filter.setAttribute("aria-pressed", String(filter === button));
    }
    for (const slot of cardSlots) {
      slot.hidden = group !== "all" && slot.dataset.group !== group;
    }
    deckSummary.textContent = summary;
  });
}
deckFilters.hidden = false;

if (typeof cardDetail.showModal === "function") {
  const detailImage = document.querySelector("#card-detail-image");
  const detailTitle = document.querySelector("#card-detail-title");
  const detailGroup = document.querySelector("#card-detail-group");
  const detailDescription = document.querySelector("#card-detail-description");

  for (const card of document.querySelectorAll(".tactic-card")) {
    card.setAttribute("aria-haspopup", "dialog");
    card.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      detailImage.src = card.href;
      detailTitle.textContent = card.getAttribute("aria-label");
      detailGroup.textContent = card.dataset.category;
      detailDescription.textContent = card.dataset.rule;
      cardDetail.showModal();
      syncBattleVideo();
    });
  }

  cardDetail.addEventListener("close", syncBattleVideo);
  cardDetail.addEventListener("click", (event) => {
    if (event.target === cardDetail) {
      const rect = cardDetail.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom) {
        cardDetail.close();
      }
    }
  });
}
