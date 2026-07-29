// Placeholder contact-form handler. This is a static site with no backend
// yet, so submission is intercepted client-side and shows a success message
// instead of actually sending anything. Before launch, replace this with a
// real static-friendly submission handler (Formspree, Netlify Forms, or a
// small serverless function) and point the <form> at it directly.

function init() {
  const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const successEl = form.querySelector<HTMLElement>("[data-form-success]");
    successEl?.classList.remove("hidden");
    form.reset();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
