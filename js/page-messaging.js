(function () {
  function notifyParent(target) {
    window.parent.postMessage({ type: "goToSlide", slide: Number(target) }, "*");
  }

  document.querySelectorAll("[data-action='goto']").forEach((button) => {
    button.addEventListener("click", () => {
      notifyParent(button.dataset.target);
    });
  });
}());
