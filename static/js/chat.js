const AppChat = {
  form: null,
  input: null,
  list: null,
  typingIndicator: null,
  welcomeArea: null,
  emptyState: null,
  messageIndex: 0,

  init() {
    this.form = document.getElementById('chat-form');
    this.input = document.getElementById('chat-input');
    this.list = document.getElementById('messages-list');
    this.typingIndicator = document.getElementById('typing-indicator-wrapper');
    this.welcomeArea = document.getElementById('welcome-area');
    this.emptyState = document.getElementById('empty-state-area');

    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendMessage();
      });
    }

    if (this.list) {
      this.list.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.copy-btn');
        if (copyBtn) {
          const text = copyBtn.dataset.text;
          this.copyToClipboard(text, copyBtn);
        }

        const productHeader = e.target.closest('.product-card-header');
        if (productHeader) {
          const card = productHeader.closest('.product-card');
          this.toggleProductCard(card);
        }
      });
    }
  },

  async sendMessage() {
    if (!this.input || !this.input.value.trim()) return;

    const text = this.input.value.trim();
    
    if (window.AppUI) {
      window.AppUI.resetInput();
    }

    this.hideOnboarding();

    this.messageIndex++;
    const userMsgId = `user-msg-${this.messageIndex}`;

    this.appendUserMessage(text, userMsgId);

    if (window.AppSidebar) {
      window.AppSidebar.addHistoryItem(text, userMsgId);
    }

    this.showTypingIndicator();
    
    if (window.AppUI) {
      window.AppUI.scrollToBottom(true);
    }

    const formData = new FormData();
    formData.append('msg', text);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('/get', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      this.hideTypingIndicator();

      const botMsgId = `bot-msg-${this.messageIndex}`;
      this.appendBotMessage(data, botMsgId);

    } catch (error) {
      this.hideTypingIndicator();
      console.error('Fetch error:', error);
      
      let errorMsg = 'Could not get response from shopping assistant. Please try again.';
      if (error.name === 'AbortError') {
        errorMsg = 'Request timed out. The server is taking too long to respond.';
      }
      
      if (window.AppToast) {
        window.AppToast.error('Network Error', errorMsg, 4000);
      }
      
      this.appendErrorMessage(errorMsg);
    }

    if (window.AppUI) {
      window.AppUI.scrollToBottom(true);
    }
  },

  hideOnboarding() {
    if (this.welcomeArea) this.welcomeArea.style.display = 'none';
    if (this.emptyState) this.emptyState.style.display = 'none';
  },

  showTypingIndicator() {
    if (this.typingIndicator) {
      this.typingIndicator.style.display = 'flex';
      this.list.appendChild(this.typingIndicator);
    }
  },

  hideTypingIndicator() {
    if (this.typingIndicator) {
      this.typingIndicator.style.display = 'none';
    }
  },

  appendUserMessage(text, msgId) {
    const timeStr = this.getFormattedTime();
    const userHtml = `
      <div class="message-wrapper user-msg animate-fade-in-up" id="${msgId}">
        <div class="message-container">
          <div class="message-bubble">
            <p>${this.escapeHTML(text)}</p>
          </div>
          <div class="message-meta">
            <span><i class="far fa-clock"></i> ${timeStr}</span>
          </div>
        </div>
        <div class="message-avatar" style="background-color: var(--accent-yellow-light); border-color: rgba(255, 216, 20, 0.4);">
          <i class="fas fa-user" style="color: var(--text-dark); font-size: 14px;"></i>
        </div>
      </div>
    `;
    this.list.insertAdjacentHTML('beforeend', userHtml);
  },

  appendBotMessage(data, msgId) {
    const timeStr = this.getFormattedTime();
    
    let parsedAnswerHtml = 'Sorry, no answer found.';
    if (window.marked && window.marked.parse) {
      parsedAnswerHtml = window.marked.parse(data.answer);
    } else {
      parsedAnswerHtml = `<p>${this.escapeHTML(data.answer)}</p>`;
    }

    let productsHtml = '';
    if (data.products && data.products.length > 0) {
      productsHtml = `<div class="product-cards-container">`;
      data.products.forEach((prod) => {
        const sentimentClass = prod.sentiment.toLowerCase();
        productsHtml += `
          <div class="product-card">
            <div class="product-card-header">
              <div class="product-card-title" title="${this.escapeHTML(prod.title)}">
                <i class="fas fa-shopping-bag text-primary me-2"></i> ${this.escapeHTML(prod.title)}
              </div>
              <div class="product-card-meta">
                <span class="sentiment-badge ${sentimentClass}">${prod.sentiment}</span>
                <i class="fas fa-chevron-down product-card-toggle-icon"></i>
              </div>
            </div>
            <div class="product-card-body">
              <p class="product-card-excerpt">"${this.escapeHTML(prod.excerpt)}"</p>
            </div>
          </div>
        `;
      });
      productsHtml += `</div>`;
    }

    const botHtml = `
      <div class="message-wrapper bot-msg animate-fade-in-up" id="${msgId}">
        <div class="message-avatar">
          <img src="/static/assets/bot-avatar.svg" alt="Bot">
        </div>
        <div class="message-container">
          <div class="message-bubble">
            ${parsedAnswerHtml}
            ${productsHtml}
          </div>
          <div class="message-meta">
            <span><i class="far fa-clock"></i> ${timeStr}</span>
            <button class="message-action-btn copy-btn" data-text="${this.escapeHTML(data.answer)}" title="Copy response">
              <i class="far fa-copy"></i> Copy
            </button>
          </div>
        </div>
      </div>
    `;

    this.list.insertAdjacentHTML('beforeend', botHtml);
  },

  appendErrorMessage(errorMsg) {
    const errorHtml = `
      <div class="message-wrapper bot-msg animate-fade-in-up">
        <div class="message-avatar" style="border-color: var(--color-negative-bg);">
          <i class="fas fa-exclamation-triangle" style="color: var(--color-negative); font-size: 14px;"></i>
        </div>
        <div class="message-container">
          <div class="message-bubble" style="border-left-color: var(--color-negative); background-color: var(--color-negative-bg); color: var(--text-dark);">
            <p>${this.escapeHTML(errorMsg)}</p>
          </div>
        </div>
      </div>
    `;
    this.list.insertAdjacentHTML('beforeend', errorHtml);
  },

  toggleProductCard(card) {
    card.classList.toggle('expanded');
  },

  copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<i class="fas fa-check text-success"></i> Copied!`;
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      if (window.AppToast) {
        window.AppToast.error('Copy Failed', 'Unable to copy text to clipboard.', 2000);
      }
    });
  },

  resetChat() {
    if (this.list && this.typingIndicator) {
      this.list.innerHTML = '';
      this.list.appendChild(this.typingIndicator);
      this.typingIndicator.style.display = 'none';
    }

    if (this.welcomeArea) this.welcomeArea.style.display = 'block';
    if (this.emptyState) this.emptyState.style.display = 'flex';

    if (window.AppUI) {
      window.AppUI.resetInput();
    }
  },

  getFormattedTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
  },

  escapeHTML(text) {
    if (!text) return '';
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
};

window.AppChat = AppChat;
