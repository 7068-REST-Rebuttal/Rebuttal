const topNav = document.querySelector(".top-nav");
const navLinks = Array.from(document.querySelectorAll(".nav-link"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const navigationInterruptKeys = new Set([
  "ArrowDown",
  "ArrowUp",
  "PageDown",
  "PageUp",
  "Home",
  "End",
  " ",
]);
let navigationLock = null;

const activateLink = (currentId) => {
  navLinks.forEach((link) => {
    const isCurrent = link.getAttribute("href") === `#${currentId}`;
    link.classList.toggle("is-current", isCurrent);
    if (isCurrent) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const getSectionFromHash = () => {
  if (!window.location.hash) {
    return null;
  }

  return sections.find((section) => `#${section.id}` === window.location.hash) || null;
};

const getActivationLine = () => {
  const navBottom = topNav ? topNav.getBoundingClientRect().bottom : 0;
  return navBottom + 24;
};

const isSectionSettled = (section) => {
  if (!section) {
    return false;
  }

  const rect = section.getBoundingClientRect();
  const activationLine = getActivationLine();
  return Math.abs(rect.top - activationLine) <= 6 || getCurrentSection() === section;
};

const getCurrentSection = () => {
  if (sections.length === 0) {
    return null;
  }

  const activationLine = getActivationLine();
  let currentSection = sections[0];

  for (const section of sections) {
    const rect = section.getBoundingClientRect();

    if (rect.top <= activationLine + 4) {
      currentSection = section;
      continue;
    }

    break;
  }

  return currentSection;
};

const clearNavigationLock = () => {
  if (!navigationLock) {
    return;
  }

  if (navigationLock.frameId) {
    window.cancelAnimationFrame(navigationLock.frameId);
  }

  navigationLock = null;
};

const watchNavigationLock = () => {
  if (!navigationLock) {
    return;
  }

  const targetSection = document.getElementById(navigationLock.targetId);
  if (!targetSection) {
    clearNavigationLock();
    requestUpdate();
    return;
  }

  const scrollDelta = Math.abs(window.scrollY - navigationLock.lastScrollY);
  navigationLock.lastScrollY = window.scrollY;
  navigationLock.idleFrames = scrollDelta < 0.5 ? navigationLock.idleFrames + 1 : 0;

  const targetSettled = isSectionSettled(targetSection);
  const timedOut = performance.now() - navigationLock.startedAt > 1800;
  const interrupted = navigationLock.idleFrames >= 10 && !targetSettled;

  if (targetSettled || timedOut || interrupted) {
    clearNavigationLock();
    requestUpdate();
    return;
  }

  navigationLock.frameId = window.requestAnimationFrame(watchNavigationLock);
};

const beginNavigationLock = (targetId) => {
  clearNavigationLock();

  navigationLock = {
    targetId,
    startedAt: performance.now(),
    lastScrollY: window.scrollY,
    idleFrames: 0,
    frameId: 0,
  };

  activateLink(targetId);
  navigationLock.frameId = window.requestAnimationFrame(watchNavigationLock);
};

const updateCurrentSection = () => {
  if (navigationLock) {
    activateLink(navigationLock.targetId);
    return;
  }

  const currentSection = getCurrentSection();
  if (currentSection) {
    activateLink(currentSection.id);
  }
};

let ticking = false;
const requestUpdate = () => {
  if (ticking) {
    return;
  }

  ticking = true;
  window.requestAnimationFrame(() => {
    updateCurrentSection();
    ticking = false;
  });
};

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const targetId = link.getAttribute("href").slice(1);
    beginNavigationLock(targetId);
  });
});

window.addEventListener("scroll", requestUpdate, { passive: true });
window.addEventListener("resize", requestUpdate);
window.addEventListener("wheel", () => {
  if (navigationLock) {
    clearNavigationLock();
    requestUpdate();
  }
}, { passive: true });
window.addEventListener("touchstart", () => {
  if (navigationLock) {
    clearNavigationLock();
    requestUpdate();
  }
}, { passive: true });
window.addEventListener("keydown", (event) => {
  if (!navigationLock) {
    return;
  }

  if (navigationInterruptKeys.has(event.key)) {
    clearNavigationLock();
    requestUpdate();
  }
});
window.addEventListener("hashchange", () => {
  const hashSection = getSectionFromHash();
  if (hashSection) {
    beginNavigationLock(hashSection.id);
    return;
  }

  requestUpdate();
});
window.addEventListener("load", () => {
  const hashSection = getSectionFromHash();
  if (hashSection) {
    activateLink(hashSection.id);
  }
  requestUpdate();
});

requestUpdate();
