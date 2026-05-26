class ToastManager {
  constructor() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container-custom';
      document.body.appendChild(this.container);
    }
  }

  show(title, message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast-custom ${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';

    toast.innerHTML = `
      <div class="toast-icon"><i class="fas ${iconClass}"></i></div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close"><i class="fas fa-times"></i></button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.dismiss(toast));

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }
  }

  dismiss(toast) {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }

  success(title, message, duration) {
    this.show(title, message, 'success', duration);
  }

  warning(title, message, duration) {
    this.show(title, message, 'warning', duration);
  }

  error(title, message, duration) {
    this.show(title, message, 'error', duration);
  }
}

window.AppToast = new ToastManager();
