/// <reference types="vite/client" />

// Augment the Window interface to include Tauri specific properties
interface Window {
  // Define properties injected by Tauri runtime
  __TAURI__?: unknown;
  __TAURI_IPC__?: unknown; // Added for IPC check
}
