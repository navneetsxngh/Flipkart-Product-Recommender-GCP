const AppSuggestions = {
  init() {
    document.addEventListener('click', (event) => {
      const chip = event.target.closest('.suggestion-chip');
      if (chip) {
        const text = chip.dataset.query || chip.textContent.trim();
        this.selectSuggestion(text);
      }
    });
  },

  selectSuggestion(text) {
    const inputArea = document.getElementById('chat-input');
    if (!inputArea) return;

    inputArea.value = text;
    
    if (window.AppUI) {
      window.AppUI.handleInputResizeAndCount();
    }
    
    inputArea.focus();
    
    const form = document.getElementById('chat-form');
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  }
};

window.AppSuggestions = AppSuggestions;
