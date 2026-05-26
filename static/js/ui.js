const AppUI = {
  chatContent: null,
  inputArea: null,
  counterEl: null,
  sendBtn: null,

  init() {
    this.chatContent = document.getElementById('chat-content');
    this.inputArea = document.getElementById('chat-input');
    this.counterEl = document.getElementById('char-counter');
    this.sendBtn = document.getElementById('send-btn');

    if (this.inputArea) {
      this.inputArea.addEventListener('input', () => this.handleInputResizeAndCount());
    }
  },

  scrollToBottom(smooth = true) {
    if (!this.chatContent) this.chatContent = document.getElementById('chat-content');
    if (this.chatContent) {
      this.chatContent.scrollTo({
        top: this.chatContent.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  },

  handleInputResizeAndCount() {
    if (!this.inputArea || !this.counterEl || !this.sendBtn) return;
    
    this.inputArea.style.height = 'auto';
    this.inputArea.style.height = `${this.inputArea.scrollHeight}px`;
    
    const length = this.inputArea.value.length;
    this.counterEl.textContent = `${length} / 500`;
    
    if (length > 500) {
      this.counterEl.style.color = 'var(--color-negative)';
    } else {
      this.counterEl.style.color = 'var(--text-muted)';
    }
    
    this.sendBtn.disabled = this.inputArea.value.trim().length === 0;
  },

  resetInput() {
    if (!this.inputArea || !this.counterEl || !this.sendBtn) return;
    this.inputArea.value = '';
    this.inputArea.style.height = 'auto';
    this.counterEl.textContent = '0 / 500';
    this.sendBtn.disabled = true;
  }
};

window.AppUI = AppUI;
