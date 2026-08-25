import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";
import { API_CONFIG } from "./config/apiConfig.js";
import { suppressNetworkErrors } from "./utils/secureErrorHandler.js";

// Suppress console logs in production-like builds
if (!API_CONFIG.DEBUG) {
  const noop = () => {};
  console.log = noop;
  console.debug = noop;
  console.info = noop;
  console.warn = noop;
  console.error = noop; // optional: silence errors in production
}

// Suppress network error messages in production for security
suppressNetworkErrors();

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
    <Toaster 
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '600',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #404040',
        },
        success: {
          style: {
            background: '#059669',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
            border: '1px solid #047857',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#059669',
          },
        },
        error: {
          style: {
            background: '#DC2626',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
            border: '1px solid #B91C1C',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#DC2626',
          },
        },
        loading: {
          style: {
            background: '#475569',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(71, 85, 105, 0.25)',
            border: '1px solid #334155',
          },
        },
      }}
    />
  </BrowserRouter>
);