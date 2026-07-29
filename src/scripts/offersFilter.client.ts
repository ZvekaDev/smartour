// Client-side filter/search/pagination engine for the Offers page.
// Reads its dataset from an embedded <script type="application/json"> tag
// (kept small — no descriptions/contact fields — see offerSummaries() in
// src/lib/offers.ts) and renders result cards + pagination into the DOM,
// syncing the current filter/page state to the URL query string so views
// are shareable and the language switcher / back button behave sensibly.

interface OfferSummary {
  id: number;
  slug: string;
  title: string;
  category: string;
  countrySlug: string;
  countySlug: string | null;
  townSlug: string | null;
  county: string;
  town: string;
  href: string;
}

interface I18nStrings {
  viewMore: string;
  noResults: string;
  resultsCount: string; // contains "{n}"
  previous: string;
  next: string;
}

const PAGE_SIZE = 12;

function parseListParam(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  return raw ? raw.split(",").filter(Boolean) : [];
}

function init() {
  const root = document.querySelector<HTMLElement>("[data-offers-root]");
  if (!root) return;

  const dataEl = document.getElementById("offers-summary-data");
  const iconEl = document.getElementById("offers-category-icons");
  const i18nEl = document.getElementById("offers-i18n");
  if (!dataEl || !iconEl || !i18nEl) return;

  const allOffers: OfferSummary[] = JSON.parse(dataEl.textContent ?? "[]");
  const categoryIcons: Record<string, string> = JSON.parse(iconEl.textContent ?? "{}");
  const i18n: I18nStrings = JSON.parse(i18nEl.textContent ?? "{}");

  const grid = root.querySelector<HTMLElement>("[data-results-grid]")!;
  const countLabel = root.querySelector<HTMLElement>("[data-results-count]")!;
  const pagination = root.querySelector<HTMLElement>("[data-pagination]")!;
  const filterSearchInput = root.querySelector<HTMLInputElement>("[data-filter-search]");
  const clearButton = root.querySelector<HTMLButtonElement>("[data-clear-filters]");
  const keywordInput = root.querySelector<HTMLInputElement>("[data-keyword-search]");
  const categoryInputs = [...root.querySelectorAll<HTMLInputElement>('input[data-filter-type="category"]')];
  const countyInputs = [...root.querySelectorAll<HTMLInputElement>('input[data-filter-type="county"]')];
  const townInputs = [...root.querySelectorAll<HTMLInputElement>('input[data-filter-type="town"]')];

  let state = {
    categories: new Set<string>(),
    counties: new Set<string>(),
    towns: new Set<string>(),
    q: "",
    page: 1,
  };

  function readStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    state.categories = new Set(parseListParam(params, "category"));
    state.counties = new Set(parseListParam(params, "county"));
    state.towns = new Set(parseListParam(params, "town"));
    state.q = params.get("q") ?? "";
    state.page = Math.max(1, Number(params.get("page")) || 1);

    for (const el of categoryInputs) el.checked = state.categories.has(el.value);
    for (const el of countyInputs) el.checked = state.counties.has(el.value);
    for (const el of townInputs) el.checked = state.towns.has(el.value);
    if (keywordInput) keywordInput.value = state.q;
  }

  function writeStateToUrl() {
    const params = new URLSearchParams();
    if (state.categories.size) params.set("category", [...state.categories].join(","));
    if (state.counties.size) params.set("county", [...state.counties].join(","));
    if (state.towns.size) params.set("town", [...state.towns].join(","));
    if (state.q) params.set("q", state.q);
    if (state.page > 1) params.set("page", String(state.page));
    const qs = params.toString();
    const newUrl = window.location.pathname + (qs ? `?${qs}` : "");
    window.history.replaceState(null, "", newUrl);
  }

  function matches(offer: OfferSummary): boolean {
    if (state.categories.size && !state.categories.has(offer.category)) return false;
    if (state.counties.size || state.towns.size) {
      const countyOk = offer.countySlug ? state.counties.has(offer.countySlug) : false;
      const townOk = offer.townSlug ? state.towns.has(offer.townSlug) : false;
      if (!countyOk && !townOk) return false;
    }
    if (state.q) {
      const needle = state.q.toLowerCase();
      const haystack = `${offer.title} ${offer.county} ${offer.town}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  }

  function cardHtml(offer: OfferSummary): string {
    const icon = categoryIcons[offer.category] ?? "📍";
    const location = offer.county || offer.countrySlug;
    return `
      <a href="${offer.href}" class="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md">
        <div class="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-5xl">
          <span aria-hidden="true">${icon}</span>
        </div>
        <div class="flex flex-1 flex-col p-4">
          <h3 class="line-clamp-2 font-display text-base font-semibold text-charcoal">${offer.title}</h3>
          <p class="mt-1 flex items-center gap-1 text-sm text-slate-muted">
            <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 21s7-6.4 7-11.5A7 7 0 0 0 5 9.5C5 14.6 12 21 12 21Z" stroke="currentColor" stroke-width="1.5" />
              <circle cx="12" cy="9.5" r="2.2" stroke="currentColor" stroke-width="1.5" />
            </svg>
            ${location}
          </p>
          <span class="mt-4 inline-flex w-full items-center justify-center rounded-full bg-coral px-4 py-2 text-sm font-medium text-white transition-colors group-hover:bg-coral-dark">
            ${i18n.viewMore}
          </span>
        </div>
      </a>`;
  }

  function render() {
    const filtered = allOffers.filter(matches);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    countLabel.textContent = i18n.resultsCount.replace("{n}", String(filtered.length));
    grid.innerHTML = pageItems.length
      ? pageItems.map(cardHtml).join("")
      : `<div class="col-span-full py-16 text-center text-slate-muted">${i18n.noResults}</div>`;

    renderPagination(totalPages);
    writeStateToUrl();
  }

  function renderPagination(totalPages: number) {
    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }
    const items: string[] = [];
    items.push(pageButton(i18n.previous, state.page - 1, state.page === 1));
    const windowSize = 2;
    for (let p = 1; p <= totalPages; p++) {
      const withinWindow = Math.abs(p - state.page) <= windowSize || p === 1 || p === totalPages;
      if (withinWindow) {
        items.push(pageButton(String(p), p, false, p === state.page));
      } else if (items[items.length - 1] !== '<span class="px-2 text-slate-400">…</span>') {
        items.push('<span class="px-2 text-slate-400">…</span>');
      }
    }
    items.push(pageButton(i18n.next, state.page + 1, state.page === totalPages));
    pagination.innerHTML = `<div class="flex flex-wrap items-center justify-center gap-1.5">${items.join("")}</div>`;
  }

  function pageButton(label: string, page: number, disabled: boolean, active = false): string {
    if (disabled) {
      return `<span class="rounded-full px-3 py-1.5 text-sm text-slate-300">${label}</span>`;
    }
    const activeClasses = active ? "bg-coral text-white" : "text-charcoal hover:bg-slate-100";
    return `<button type="button" class="rounded-full px-3 py-1.5 text-sm ${activeClasses}" data-page-btn="${page}">${label}</button>`;
  }

  // County checkboxes live inside a <details><summary> (used for the
  // expand/collapse UI) — stop the click from also toggling the <details>
  // open/closed.
  for (const el of countyInputs) {
    el.addEventListener("click", (e) => e.stopPropagation());
  }

  // Event wiring
  for (const el of [...categoryInputs, ...countyInputs, ...townInputs]) {
    el.addEventListener("change", () => {
      state.categories = new Set(categoryInputs.filter((i) => i.checked).map((i) => i.value));
      state.counties = new Set(countyInputs.filter((i) => i.checked).map((i) => i.value));
      state.towns = new Set(townInputs.filter((i) => i.checked).map((i) => i.value));
      state.page = 1;
      render();
    });
  }

  keywordInput?.addEventListener("input", () => {
    state.q = keywordInput.value.trim();
    state.page = 1;
    render();
  });

  // Also wire the hero search box (outside [data-offers-root]) if present —
  // it submits a `q` GET param, so on load we already pick it up via the URL.

  clearButton?.addEventListener("click", () => {
    for (const el of [...categoryInputs, ...countyInputs, ...townInputs]) el.checked = false;
    if (keywordInput) keywordInput.value = "";
    if (filterSearchInput) filterSearchInput.value = "";
    for (const label of root.querySelectorAll<HTMLElement>("[data-filter-label]")) label.style.display = "";
    state = { categories: new Set(), counties: new Set(), towns: new Set(), q: "", page: 1 };
    render();
  });

  // "Search filters..." box narrows the checkbox LIST itself, not the results.
  filterSearchInput?.addEventListener("input", () => {
    const term = filterSearchInput.value.trim().toLowerCase();
    for (const label of root.querySelectorAll<HTMLElement>("[data-filter-label]")) {
      const text = label.textContent?.toLowerCase() ?? "";
      label.style.display = !term || text.includes(term) ? "" : "none";
    }
  });

  pagination.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-page-btn]");
    if (!target) return;
    state.page = Number(target.dataset.pageBtn);
    render();
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  readStateFromUrl();
  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
