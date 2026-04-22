
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);

  // Display a user-friendly error message overlay
  showErrorOverlay('An unexpected error occurred. Please refresh the page or contact support.');
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);

  // Display a user-friendly error message overlay
  showErrorOverlay('An unexpected error occurred. Please refresh the page or contact support.');
});

// Function to display a user-friendly error overlay
function showErrorOverlay(message: string) {
  // Remove any existing error overlays
  const existingOverlay = document.getElementById('error-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  // Create a user-friendly error overlay
  const overlay = document.createElement('div');
  overlay.id = 'error-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  overlay.style.color = 'white';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '9999';
  overlay.style.fontFamily = 'Arial, sans-serif';
  overlay.style.textAlign = 'center';
  overlay.style.padding = '20px';

  overlay.innerHTML = `
    <div style="max-width: 600px; background: #1f2937; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #ef4444; margin-bottom: 15px;">Application Error</h2>
      <p style="margin-bottom: 20px; color: #d1d5db;">${message}</p>
      <button onclick="location.reload()" style="
        background: #10b981; 
        color: white; 
        border: none; 
        padding: 12px 24px; 
        border-radius: 6px; 
        cursor: pointer; 
        font-size: 16px;
        font-weight: bold;
        margin-top: 10px;">
        Refresh Page
      </button>
      <p style="margin-top: 20px; font-size: 14px; color: #9ca3af;">
        If the problem persists, please contact technical support.
      </p>
    </div>
  `;

  document.body.appendChild(overlay);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
