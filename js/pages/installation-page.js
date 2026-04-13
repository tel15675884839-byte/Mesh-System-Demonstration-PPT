(function() {
  const wipeStage = document.getElementById('wipeStage');

  if (!wipeStage) return;

  function setWipeState(isActive) {
    if (isActive) {
      wipeStage.classList.add('active');
    } else {
      wipeStage.classList.remove('active');
    }
  }

  // Click to toggle animation
  wipeStage.addEventListener('click', () => {
    const isActive = wipeStage.classList.contains('active');
    setWipeState(!isActive);
  });

  // Slide visibility listener - only used to reset state when leaving the page
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'slideVisibility') {
      if (!event.data.active) {
        // Reset to "Before" state when page is hidden
        setWipeState(false);
      }
    }
  });
})();
