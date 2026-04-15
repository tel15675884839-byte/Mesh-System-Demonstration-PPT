(function () {
  function createSearchParams(search) {
    const SearchParams = window.URLSearchParams || (typeof URLSearchParams === "function" ? URLSearchParams : null);
    if (SearchParams) {
      return new SearchParams(search || "");
    }

    return {
      get() {
        return null;
      },
      set() {},
      delete() {},
      toString() {
        return "";
      }
    };
  }

  function getSharedLocation() {
    try {
      if (window.parent && window.parent !== window && window.parent.location) {
        return window.parent.location;
      }
    } catch (error) {
      console.warn("Presentation messaging fell back to local location access.", error);
    }

    return window.location;
  }

  function getSharedSearchParams() {
    return createSearchParams((getSharedLocation() && getSharedLocation().search) || "");
  }

  function replaceCurrentUrl(params) {
    const search = params.toString();
    const nextUrl = window.location.pathname + (search ? "?" + search : "");

    if (window.history && typeof window.history.replaceState === "function") {
      window.history.replaceState(null, "", nextUrl);
    }
  }

  function syncPresentationState(state) {
    if (window.parent && window.parent !== window && typeof window.parent.postMessage === "function") {
      window.parent.postMessage({ type: "syncPresentationState", state: state || {} }, "*");
      return;
    }

    const params = getSharedSearchParams();
    Object.keys(state || {}).forEach(function (key) {
      const value = state[key];
      if (value === null || value === undefined || value === "") {
        params.delete(key);
        return;
      }
      params.set(key, String(value));
    });

    replaceCurrentUrl(params);
  }

  function notifyParent(target) {
    window.parent.postMessage({ type: "goToSlide", slide: Number(target) }, "*");
  }

  window.meshPresentationMessaging = {
    getSharedSearchParams: getSharedSearchParams,
    syncPresentationState: syncPresentationState,
    notifyParent: notifyParent
  };

  document.querySelectorAll("[data-action='goto']").forEach((button) => {
    button.addEventListener("click", () => {
      notifyParent(button.dataset.target);
    });
  });
}());
