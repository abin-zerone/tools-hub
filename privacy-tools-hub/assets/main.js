(() => {
  "use strict";
  const tools = Array.isArray(window.TOOL_REGISTRY) ? window.TOOL_REGISTRY : [];
  const search = document.getElementById("tool-search");
  const filters = document.getElementById("category-filters");
  const grid = document.getElementById("tool-grid");
  const empty = document.getElementById("empty-state");
  const resultCount = document.getElementById("result-count");
  const liveRegion = document.getElementById("results-announcement");
  let activeCategory = "All";

  const categories = ["All", ...new Set(tools.map((tool) => tool.category))];
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = category;
    button.dataset.category = category;
    button.setAttribute("aria-pressed", String(category === activeCategory));
    button.addEventListener("click", () => {
      activeCategory = category;
      filters.querySelectorAll("button").forEach((chip) => {
        chip.setAttribute("aria-pressed", String(chip.dataset.category === activeCategory));
      });
      render();
    });
    filters.appendChild(button);
  });

  function createCard(tool) {
    const card = document.createElement(tool.status === "live" ? "a" : "div");
    card.className = `tool-card${tool.status === "live" ? "" : " coming-soon"}`;
    if (tool.status === "live") {
      card.href = tool.folder;
      card.setAttribute("aria-label", `${tool.name}: ${tool.description}`);
    } else {
      card.setAttribute("aria-disabled", "true");
      card.setAttribute("aria-label", `${tool.name}, coming soon. ${tool.description}`);
    }

    const top = document.createElement("div");
    top.className = "card-top";
    const icon = document.createElement("span");
    icon.className = "tool-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = tool.icon;
    const labels = document.createElement("div");
    labels.className = "card-labels";
    const category = document.createElement("span");
    category.className = "category-label";
    category.textContent = tool.category;
    labels.appendChild(category);
    if (tool.status !== "live") {
      const status = document.createElement("span");
      status.className = "status-label";
      status.textContent = "Coming soon";
      labels.appendChild(status);
    }
    top.append(icon, labels);

    const title = document.createElement("h2");
    title.textContent = tool.name;
    const description = document.createElement("p");
    description.textContent = tool.description;
    const tags = document.createElement("div");
    tags.className = "card-tags";
    tool.tags.slice(0, 4).forEach((tagText) => {
      const tag = document.createElement("span");
      tag.textContent = `#${tagText}`;
      tags.appendChild(tag);
    });
    card.append(top, title, description, tags);
    return card;
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const visibleTools = tools.filter((tool) => {
      const searchable = [tool.name, tool.description, tool.category, ...tool.tags].join(" ").toLocaleLowerCase();
      return (!query || searchable.includes(query)) && (activeCategory === "All" || tool.category === activeCategory);
    });
    grid.replaceChildren();
    visibleTools.forEach((tool) => grid.appendChild(createCard(tool)));
    empty.hidden = visibleTools.length > 0;
    resultCount.textContent = `${visibleTools.length} ${visibleTools.length === 1 ? "tool" : "tools"}`;
    liveRegion.textContent = `${visibleTools.length} ${visibleTools.length === 1 ? "tool" : "tools"} found`;
  }

  search.addEventListener("input", render);
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLElement &&
      (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
    if (event.key === "/" && !isTyping && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      search.focus();
      return;
    }
    if (isTyping || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    const cards = [...grid.querySelectorAll("a.tool-card")];
    if (!cards.length) return;
    const currentIndex = cards.indexOf(document.activeElement);
    if (currentIndex < 0) {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        cards[0].focus();
      }
      return;
    }
    const columns = window.matchMedia("(max-width: 700px)").matches ? 1 :
      (window.matchMedia("(max-width: 800px)").matches ? 2 : 3);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = Math.min(cards.length - 1, currentIndex + 1);
    if (event.key === "ArrowLeft") nextIndex = Math.max(0, currentIndex - 1);
    if (event.key === "ArrowDown") nextIndex = Math.min(cards.length - 1, currentIndex + columns);
    if (event.key === "ArrowUp") nextIndex = Math.max(0, currentIndex - columns);
    if (nextIndex !== currentIndex) {
      event.preventDefault();
      cards[nextIndex].focus();
    }
  });

  render();
})();