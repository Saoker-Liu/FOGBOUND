const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const sea = document.querySelector("#sea-motion");
const motionToggle = document.querySelector("#motion-toggle");
const clip = document.querySelector("#clip-video");
const reel = document.querySelector("#reel");
const reelVideo = document.querySelector("#reel-video");
const reelTitle = document.querySelector("#reel-title");

let motionEnabled = !reducedMotion.matches;
let seaVisible = true;
let clipVisible = false;
let clipPreviewPending = true;

function play(video) {
  video.play().catch(() => {
    // The poster and native video controls cover browsers that require a gesture.
  });
}

function syncSeaMotion() {
  motionToggle.setAttribute("aria-pressed", String(!motionEnabled));
  motionToggle.title = motionEnabled ? "暂停背景动画" : "播放背景动画";

  if (!motionEnabled || !seaVisible || document.hidden || reel.open) {
    sea.pause();
    return;
  }

  if (!sea.hasAttribute("src")) sea.src = sea.dataset.src;
  play(sea);
}

function syncClipPreview() {
  if (!clipVisible || document.hidden || reel.open) {
    if (!clip.paused) {
      clipPreviewPending = clip.muted;
      clip.pause();
    }
    return;
  }

  if (clipPreviewPending && !reducedMotion.matches) {
    clipPreviewPending = false;
    play(clip);
  }
}

motionToggle.hidden = false;
motionToggle.addEventListener("click", () => {
  motionEnabled = !motionEnabled;
  syncSeaMotion();
});
sea.addEventListener("error", () => {
  motionToggle.hidden = true;
});

document.addEventListener("visibilitychange", () => {
  syncSeaMotion();
  syncClipPreview();
});

reducedMotion.addEventListener("change", ({ matches }) => {
  motionEnabled = !matches;
  syncSeaMotion();
  if (matches && clip.muted) clip.pause();
});

if ("IntersectionObserver" in window) {
  const mediaObserver = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (target === sea) {
        seaVisible = isIntersecting;
        syncSeaMotion();
      } else {
        clipVisible = isIntersecting;
        syncClipPreview();
      }
    }
  }, { threshold: 0.25 });
  mediaObserver.observe(sea);
  mediaObserver.observe(clip);

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
} else {
  syncSeaMotion();
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

const clipTabs = document.querySelector("#clip-tabs");
const clipTitle = document.querySelector("#clip-title");
const clipCaption = document.querySelector("#clip-caption");

bindTabs(clipTabs, (tab) => {
  const name = tab.querySelector(".clip-tab__title").textContent;
  clip.pause();
  clip.poster = "media/" + tab.dataset.clip + ".webp";
  clip.src = "media/" + tab.dataset.clip + ".mp4";
  clip.setAttribute("aria-label", name);
  clipTitle.textContent = name;
  clipCaption.textContent = tab.dataset.caption;
  clipPreviewPending = true;
  syncClipPreview();
});

const chapterTabs = document.querySelector("#chapter-tabs");
const chapterArt = document.querySelector("#chapter-art");
const chapterLabel = document.querySelector("#chapter-label");
const chapterTitle = document.querySelector("#chapter-title");
const chapterCaption = document.querySelector("#chapter-caption");
const wide = matchMedia("(min-width: 981px)");

function updateTabOrientation() {
  const orientation = wide.matches ? "vertical" : "horizontal";
  clipTabs.setAttribute("aria-orientation", orientation);
  chapterTabs.setAttribute("aria-orientation", orientation);
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

const cards = [...document.querySelectorAll(".tactic-card")];
const tacticTitle = document.querySelector("#tactic-title");
const tacticType = document.querySelector("#tactic-type");
const tacticCaption = document.querySelector("#tactic-caption");
for (const card of cards) {
  card.addEventListener("click", () => {
    for (const item of cards) item.setAttribute("aria-pressed", String(item === card));
    tacticTitle.textContent = card.getAttribute("aria-label");
    tacticType.textContent = card.dataset.type;
    tacticCaption.textContent = card.dataset.caption;
  });
}

if (typeof reel.showModal === "function") {
  for (const link of document.querySelectorAll("[data-reel-title]")) {
    link.setAttribute("aria-haspopup", "dialog");
    link.addEventListener("click", (event) => {
      event.preventDefault();
      reelTitle.textContent = link.dataset.reelTitle;
      if (reelVideo.src !== link.href) {
        reelVideo.poster = link.dataset.poster;
        reelVideo.src = link.href;
      } else {
        reelVideo.currentTime = 0;
      }
      reel.showModal();
      syncSeaMotion();
      syncClipPreview();
      play(reelVideo);
    });
  }

  reel.addEventListener("close", () => {
    reelVideo.pause();
    syncSeaMotion();
    syncClipPreview();
  });

  reel.addEventListener("click", (event) => {
    if (event.target === reel) {
      const rect = reel.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom) {
        reel.close();
      }
    }
  });
}
