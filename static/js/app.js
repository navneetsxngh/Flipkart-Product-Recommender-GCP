document.addEventListener('DOMContentLoaded', () => {
  console.log('Flipkart AI Shopping Assistant initializing...');
  
  if (window.AppUI) window.AppUI.init();
  if (window.AppSidebar) window.AppSidebar.init();
  if (window.AppSuggestions) window.AppSuggestions.init();
  if (window.AppChat) window.AppChat.init();

  const appLoader = document.getElementById('initial-skeleton-loader');
  const appWrapper = document.getElementById('app-wrapper');

  if (appLoader && appWrapper) {
    setTimeout(() => {
      appLoader.style.opacity = '0';
      appWrapper.style.opacity = '1';
      
      appLoader.addEventListener('transitionend', () => {
        appLoader.remove();
      });

      if (window.AppToast) {
        window.AppToast.success(
          'Assistant Ready', 
          'Welcome to the Flipkart AI Shopping Assistant! Ask anything about Flipkart products.', 
          3500
        );
      }
    }, 800);
  }
});
