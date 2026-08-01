// Offer detail page photo/video gallery: main-frame carousel + thumbnail strip
// + fullscreen lightbox with click/wheel zoom and drag-to-pan on photos.

interface MediaItem {
  index: number;
  kind: "photo" | "video";
  thumb: string | null;
  full: string | null;
  alt: string;
  embedUrl: string | null;
  fileUrl: string | null;
  linkUrl: string | null;
  caption: string | null;
}

interface GalleryI18n {
  close: string;
  next: string;
  previous: string;
  viewFullscreen: string;
  counter: string; // "{current} of {total}"
  watchVideo: string;
}

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP_CLICK = 1.6;
const SWIPE_THRESHOLD = 50;

function initGallery(root: HTMLElement) {
  const dataEl = root.querySelector<HTMLElement>("[data-gallery-media]");
  const i18nEl = root.querySelector<HTMLElement>("[data-gallery-i18n]");
  if (!dataEl || !i18nEl) return;

  const media: MediaItem[] = JSON.parse(dataEl.textContent ?? "[]");
  const i18n: GalleryI18n = JSON.parse(i18nEl.textContent ?? "{}");
  if (media.length === 0) return;

  let mainIndex = 0;

  const mainFrame = root.querySelector<HTMLElement>("[data-gallery-main-frame]")!;
  const slides = [...root.querySelectorAll<HTMLElement>("[data-gallery-slide]")];
  const thumbs = [...root.querySelectorAll<HTMLElement>("[data-gallery-thumb]")];
  const counterInline = root.querySelector<HTMLElement>("[data-gallery-counter-inline]");
  const prevBtn = root.querySelector<HTMLElement>("[data-gallery-prev]");
  const nextBtn = root.querySelector<HTMLElement>("[data-gallery-next]");
  const openBtn = root.querySelector<HTMLElement>("[data-gallery-open]");

  const lightbox = root.querySelector<HTMLElement>("[data-gallery-lightbox]")!;
  const lbContent = root.querySelector<HTMLElement>("[data-gallery-lb-content]")!;
  const lbThumbs = root.querySelector<HTMLElement>("[data-gallery-lb-thumbs]")!;
  const lbCounter = root.querySelector<HTMLElement>("[data-gallery-counter]")!;
  const lbClose = root.querySelector<HTMLElement>("[data-gallery-close]");
  const lbPrev = root.querySelector<HTMLElement>("[data-gallery-lb-prev]");
  const lbNext = root.querySelector<HTMLElement>("[data-gallery-lb-next]");
  const zoomInBtn = root.querySelector<HTMLElement>("[data-gallery-zoom-in]");
  const zoomOutBtn = root.querySelector<HTMLElement>("[data-gallery-zoom-out]");
  const stage = root.querySelector<HTMLElement>("[data-gallery-stage]")!;

  let lightboxOpen = false;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panStartX = 0;
  let panStartY = 0;

  function updateInlineCounter() {
    if (counterInline) counterInline.textContent = `${mainIndex + 1}/${media.length}`;
  }

  function setMainIndex(i: number, scrollThumbIntoView = true) {
    mainIndex = (i + media.length) % media.length;
    slides.forEach((el, idx) => el.classList.toggle("hidden", idx !== mainIndex));
    thumbs.forEach((el, idx) => {
      el.classList.toggle("border-coral", idx === mainIndex);
      el.classList.toggle("border-transparent", idx !== mainIndex);
    });
    if (scrollThumbIntoView) {
      // block: "nearest" still scrolls the whole page on first paint if the
      // gallery is below the fold, so this must never run on initial load.
      thumbs[mainIndex]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
    updateInlineCounter();
  }

  prevBtn?.addEventListener("click", () => setMainIndex(mainIndex - 1));
  nextBtn?.addEventListener("click", () => setMainIndex(mainIndex + 1));
  thumbs.forEach((el, idx) => el.addEventListener("click", () => setMainIndex(idx)));
  mainFrame.addEventListener("click", (e) => {
    // Ignore clicks on the prev/next/expand buttons themselves (they stop propagation below).
    openLightbox(mainIndex);
  });
  [prevBtn, nextBtn, openBtn].forEach((btn) => btn?.addEventListener("click", (e) => e.stopPropagation()));

  function resetZoom() {
    zoom = 1;
    panX = 0;
    panY = 0;
    applyTransform();
  }

  function applyTransform() {
    const media = lbContent.querySelector<HTMLElement>("[data-zoomable]");
    if (media) media.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    lbContent.style.cursor = zoom > 1 ? "grab" : "";
    if (zoomInBtn) zoomInBtn.style.opacity = zoom >= ZOOM_MAX ? "0.4" : "1";
    if (zoomOutBtn) zoomOutBtn.style.opacity = zoom <= ZOOM_MIN ? "0.4" : "1";
  }

  function renderLightboxSlide(i: number) {
    const item = media[i];
    lbContent.innerHTML = "";
    resetZoom();

    if (item.kind === "photo" && item.full) {
      const img = document.createElement("img");
      img.src = item.full;
      img.alt = item.alt;
      img.draggable = false;
      img.dataset.zoomable = "true";
      img.className = "max-h-full max-w-full select-none object-contain transition-transform duration-150 will-change-transform";
      lbContent.appendChild(img);
    } else if (item.kind === "video" && item.embedUrl) {
      const wrap = document.createElement("div");
      wrap.className = "aspect-video w-full max-w-4xl";
      const iframe = document.createElement("iframe");
      iframe.src = item.embedUrl;
      iframe.className = "h-full w-full rounded-lg";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      wrap.appendChild(iframe);
      lbContent.appendChild(wrap);
    } else if (item.kind === "video" && item.fileUrl) {
      const video = document.createElement("video");
      video.src = item.fileUrl;
      video.controls = true;
      video.autoplay = true;
      video.className = "max-h-full max-w-full rounded-lg";
      lbContent.appendChild(video);
    } else if (item.linkUrl) {
      const a = document.createElement("a");
      a.href = item.linkUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "text-white underline";
      a.textContent = `${i18n.watchVideo} ↗`;
      lbContent.appendChild(a);
    }

    lbCounter.textContent = i18n.counter.replace("{current}", String(i + 1)).replace("{total}", String(media.length));
    lbThumbs.querySelectorAll("[data-lb-thumb]").forEach((el, idx) => {
      el.classList.toggle("border-coral", idx === i);
      el.classList.toggle("border-transparent", idx !== i);
    });
  }

  function buildLightboxThumbs() {
    lbThumbs.innerHTML = "";
    if (media.length <= 1) return;
    media.forEach((item, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.lbThumb = "true";
      btn.className =
        "relative aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-md border-2 border-transparent opacity-70 transition-opacity hover:opacity-100 sm:w-20";
      const img = document.createElement("img");
      img.loading = "lazy";
      img.className = "h-full w-full object-cover";
      img.src = item.thumb ?? "";
      img.alt = "";
      btn.appendChild(img);
      btn.addEventListener("click", () => {
        lightboxIndex = idx;
        renderLightboxSlide(idx);
      });
      lbThumbs.appendChild(btn);
    });
  }

  let lightboxIndex = 0;

  function openLightbox(i: number) {
    lightboxIndex = i;
    lightboxOpen = true;
    lightbox.classList.remove("hidden");
    lightbox.classList.add("flex");
    document.body.style.overflow = "hidden";
    buildLightboxThumbs();
    renderLightboxSlide(i);
  }

  function closeLightbox() {
    lightboxOpen = false;
    lightbox.classList.add("hidden");
    lightbox.classList.remove("flex");
    document.body.style.overflow = "";
    lbContent.innerHTML = "";
    setMainIndex(lightboxIndex);
  }

  function lightboxStep(delta: number) {
    lightboxIndex = (lightboxIndex + delta + media.length) % media.length;
    renderLightboxSlide(lightboxIndex);
  }

  lbClose?.addEventListener("click", closeLightbox);
  lbPrev?.addEventListener("click", () => lightboxStep(-1));
  lbNext?.addEventListener("click", () => lightboxStep(1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  zoomInBtn?.addEventListener("click", () => {
    zoom = Math.min(ZOOM_MAX, zoom + 0.5);
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    zoom = Math.max(ZOOM_MIN, zoom - 0.5);
    if (zoom === ZOOM_MIN) {
      panX = 0;
      panY = 0;
    }
    applyTransform();
  });

  // Click-to-zoom on the image, anchored roughly at the click point via pan offset.
  lbContent.addEventListener("click", (e) => {
    const img = (e.target as HTMLElement).closest("[data-zoomable]") as HTMLElement | null;
    if (!img) return;
    if (dragMoved) {
      dragMoved = false;
      return;
    }
    if (zoom === 1) {
      zoom = ZOOM_STEP_CLICK;
    } else {
      zoom = 1;
      panX = 0;
      panY = 0;
    }
    applyTransform();
  });

  // Wheel zoom (desktop).
  lbContent.addEventListener(
    "wheel",
    (e) => {
      const img = lbContent.querySelector("[data-zoomable]");
      if (!img) return;
      e.preventDefault();
      const next = zoom - e.deltaY * 0.0015;
      zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
      if (zoom === ZOOM_MIN) {
        panX = 0;
        panY = 0;
      }
      applyTransform();
    },
    { passive: false },
  );

  // Drag-to-pan when zoomed in.
  let dragMoved = false;
  lbContent.addEventListener("mousedown", (e) => {
    if (zoom <= 1) return;
    dragging = true;
    dragMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    panStartX = panX;
    panStartY = panY;
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
    panX = panStartX + dx;
    panY = panStartY + dy;
    applyTransform();
  });
  window.addEventListener("mouseup", () => {
    dragging = false;
  });

  // Touch swipe to navigate (only when not zoomed).
  let touchStartX = 0;
  stage.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  });
  stage.addEventListener("touchend", (e) => {
    if (zoom > 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx > SWIPE_THRESHOLD) lightboxStep(-1);
    else if (dx < -SWIPE_THRESHOLD) lightboxStep(1);
  });

  document.addEventListener("keydown", (e) => {
    if (!lightboxOpen) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") lightboxStep(-1);
    else if (e.key === "ArrowRight") lightboxStep(1);
  });

  setMainIndex(0, false);
}

document.querySelectorAll<HTMLElement>("[data-offer-gallery]").forEach(initGallery);
