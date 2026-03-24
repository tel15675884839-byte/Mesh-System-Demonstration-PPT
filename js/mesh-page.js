(function () {
  const meshStates = {
    normal: {
      title: "Default route is active",
      copy: "Signal follows the primary path from detector to panel through the mesh network.",
      activeLines: ["line-primary-a", "line-primary-b", "line-blocked"],
      dimmedLines: ["line-backup-a", "line-backup-b"],
      blockedLines: []
    },
    blocked: {
      title: "Primary route is interrupted",
      copy: "One link becomes unavailable, so the transmission is visibly interrupted before reaching the panel.",
      activeLines: ["line-primary-a", "line-primary-b"],
      dimmedLines: ["line-backup-a", "line-backup-b"],
      blockedLines: ["line-blocked"]
    },
    recovery: {
      title: "Backup path recovers communication",
      copy: "The mesh network reroutes through a secondary path automatically to maintain stable delivery.",
      activeLines: ["line-backup-a", "line-backup-b", "line-blocked"],
      dimmedLines: ["line-primary-a", "line-primary-b"],
      blockedLines: []
    }
  };

  function applyMeshMode(mode) {
    const network = document.getElementById("mesh-network");
    const title = document.getElementById("mesh-status-title");
    const copy = document.getElementById("mesh-status-copy");
    const buttons = document.querySelectorAll(".mode-button");

    if (!network || !title || !copy || !meshStates[mode]) {
      return;
    }

    const state = meshStates[mode];
    network.dataset.mode = mode;
    title.textContent = state.title;
    copy.textContent = state.copy;

    ["line-primary-a", "line-primary-b", "line-backup-a", "line-backup-b", "line-blocked"].forEach((id) => {
      const line = document.getElementById(id);
      if (!line) {
        return;
      }

      line.classList.remove("active", "dimmed", "blocked");

      if (state.activeLines.includes(id)) {
        line.classList.add("active");
      }

      if (state.dimmedLines.includes(id)) {
        line.classList.add("dimmed");
      }

      if (state.blockedLines.includes(id)) {
        line.classList.add("blocked");
      }
    });

    buttons.forEach((button) => {
      const isActive = button.dataset.mode === mode;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
  }

  document.querySelectorAll(".mode-button").forEach((button) => {
    button.addEventListener("click", () => applyMeshMode(button.dataset.mode));
  });

  applyMeshMode("normal");
}());
