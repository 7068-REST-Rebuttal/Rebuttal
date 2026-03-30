document.addEventListener("DOMContentLoaded", () => {
  if (typeof renderMathInElement !== "function") {
    return;
  }

  const root = document.querySelector(".sections");
  if (!root) {
    return;
  }

  renderMathInElement(root, {
    delimiters: [
      { left: "\\(", right: "\\)", display: false },
      { left: "\\[", right: "\\]", display: true },
    ],
    throwOnError: false,
    strict: "ignore",
    ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"],
  });
});
