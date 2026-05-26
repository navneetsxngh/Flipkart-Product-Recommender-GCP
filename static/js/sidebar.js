const AppSidebar = {
  container: null,
  sidebarToggle: null,
  mobileSidebarToggle: null,
  overlay: null,
  historyList: null,
  historyItems: [],

  init() {
    this.container = document.querySelector('.app-container');
    this.sidebarToggle = document.getElementById('sidebar-toggle-btn');
    this.mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
    this.overlay = document.getElementById('sidebar-overlay');
    this.historyList = document.getElementById('sidebar-history-list');

    if (this.sidebarToggle) {
      this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
    }

    if (this.mobileSidebarToggle) {
      this.mobileSidebarToggle.addEventListener('click', () => this.openMobileSidebar());
    }

    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.closeMobileSidebar());
    }

    const collapseActionBtn = document.getElementById('sidebar-collapse-action');
    if (collapseActionBtn) {
      collapseActionBtn.addEventListener('click', () => this.toggleSidebar());
    }

    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => this.handleNewChat());
    }

    const clearChatBtn = document.getElementById('clear-chat-btn');
    if (clearChatBtn) {
      clearChatBtn.addEventListener('click', () => this.handleClearChat());
    }
  },

  toggleSidebar() {
    if (!this.container) return;
    const isMobile = window.innerWidth <= 992;
    if (isMobile) {
      if (this.container.classList.contains('sidebar-open')) {
        this.closeMobileSidebar();
      } else {
        this.openMobileSidebar();
      }
    } else {
      this.container.classList.toggle('sidebar-collapsed');
      setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
    }
  },

  openMobileSidebar() {
    if (!this.container || !this.overlay) return;
    this.container.classList.add('sidebar-open');
    this.overlay.classList.add('active');
  },

  closeMobileSidebar() {
    if (!this.container || !this.overlay) return;
    this.container.classList.remove('sidebar-open');
    this.overlay.classList.remove('active');
  },

  addHistoryItem(question, messageId) {
    if (!this.historyList) return;

    if (this.historyItems.some(item => item.question === question)) return;

    const emptyPlaceholder = this.historyList.querySelector('.history-empty');
    if (emptyPlaceholder) {
      emptyPlaceholder.remove();
    }

    const item = { question, messageId };
    this.historyItems.push(item);

    const historyEl = document.createElement('div');
    historyEl.className = 'history-item';
    historyEl.dataset.targetId = messageId;
    historyEl.innerHTML = `
      <i class="fas fa-comment-alt"></i>
      <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${question}</span>
    `;

    historyEl.addEventListener('click', () => {
      this.scrollToMessage(messageId);
      this.closeMobileSidebar();
    });

    this.historyList.appendChild(historyEl);
  },

  scrollToMessage(messageId) {
    const targetElement = document.getElementById(messageId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetElement.style.transition = 'background-color 0.5s ease';
      const originalBg = targetElement.style.backgroundColor;
      targetElement.style.backgroundColor = 'var(--primary-blue-light)';
      setTimeout(() => {
        targetElement.style.backgroundColor = originalBg;
      }, 1000);
    }
  },

  handleNewChat() {
    if (window.AppChat) {
      window.AppChat.resetChat();
      if (window.AppToast) {
        window.AppToast.success('New Chat', 'Started a fresh shopping assistant session.', 2500);
      }
    }
  },

  handleClearChat() {
    if (window.AppChat) {
      window.AppChat.resetChat();
    }
    this.historyItems = [];
    if (this.historyList) {
      this.historyList.innerHTML = `
        <div class="history-empty">
          No previous questions in this session.
        </div>
      `;
    }
    if (window.AppToast) {
      window.AppToast.success('Chat Cleared', 'Conversation history was cleared successfully.', 2500);
    }
  }
};

window.AppSidebar = AppSidebar;
