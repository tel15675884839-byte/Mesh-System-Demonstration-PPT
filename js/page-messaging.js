(function () {
  const rootElement = document.documentElement || null;
  const bodyElement = document.body || null;
  const startsActive = window.parent === window;

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

  function syncSvgAnimations(isActive) {
    if (typeof document.querySelectorAll !== "function") {
      return;
    }

    document.querySelectorAll("svg").forEach(function (svg) {
      if (isActive) {
        if (typeof svg.unpauseAnimations === "function") {
          svg.unpauseAnimations();
        }
        return;
      }

      if (typeof svg.pauseAnimations === "function") {
        svg.pauseAnimations();
      }
    });
  }

  function notifySlideActivity(isActive) {
    if (typeof window.dispatchEvent !== "function") {
      return;
    }

    const ActivityEvent = typeof CustomEvent === "function"
      ? CustomEvent
      : function FallbackEvent(type, init) {
          this.type = type;
          this.detail = init ? init.detail : undefined;
        };

    window.dispatchEvent(new ActivityEvent("slideActivityChange", {
      detail: {
        active: !!isActive
      }
    }));
  }

  function setSlideActivity(isActive) {
    const active = !!isActive;

    if (rootElement && rootElement.dataset) {
      rootElement.dataset.slideActive = active ? "true" : "false";
    }

    if (bodyElement && bodyElement.dataset) {
      bodyElement.dataset.slideActive = active ? "true" : "false";
    }

    syncSvgAnimations(active);
    notifySlideActivity(active);
  }

  window.meshPresentationMessaging = {
    getSharedSearchParams: getSharedSearchParams,
    syncPresentationState: syncPresentationState,
    notifyParent: notifyParent
  };

  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "slideVisibility") {
      return;
    }

    setSlideActivity(event.data.active);
  });

  document.querySelectorAll("[data-action='goto']").forEach((button) => {
    button.addEventListener("click", () => {
      notifyParent(button.dataset.target);
    });
  });

  setSlideActivity(startsActive);
}());
