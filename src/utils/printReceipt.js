import React from "react";
import ReactDOM from "react-dom/client";
import ThermalReceipt from "../components/ThermalReceipt";

/**
 * Prints a thermal receipt for the given order
 * @param {Object} order - The order object to print
 * @param {boolean} isKtv - Whether this is a KTV order (default: false)
 */
export const printReceipt = (order, isKtv = false, paperSize = "A5") => {
  // Remove any existing print container and styles
  const existingContainer = document.getElementById(
    "thermal-receipt-print-container"
  );
  const existingStyles = document.getElementById(
    "thermal-receipt-print-styles"
  );
  if (existingContainer) {
    existingContainer.remove();
  }
  if (existingStyles) {
    existingStyles.remove();
  }

  // Inject minimal global print styles (component controls page size and width)
  const styleElement = document.createElement("style");
  styleElement.id = "thermal-receipt-print-styles";
  styleElement.textContent = `
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100%;
        height: 100%;
      }
      body > *:not(#thermal-receipt-print-container) {
        display: none !important;
      }
      #thermal-receipt-print-container {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        display: flex !important;
        justify-content: center !important;
        align-items: flex-start !important;
        z-index: 99999 !important;
      }
    }
  `;
  document.head.appendChild(styleElement);

  // Create a temporary container for the receipt
  const printContainer = document.createElement("div");
  printContainer.id = "thermal-receipt-print-container";
  printContainer.style.position = "fixed";
  printContainer.style.top = "0";
  printContainer.style.left = "0";
  printContainer.style.width = "100vw";
  printContainer.style.height = "100vh";
  printContainer.style.zIndex = "99999";
  printContainer.style.backgroundColor = "white";
  printContainer.style.display = "flex";
  printContainer.style.justifyContent = "center";
  printContainer.style.alignItems = "flex-start";
  printContainer.style.paddingTop = "20px";
  printContainer.style.overflow = "auto";
  document.body.appendChild(printContainer);

  // Create a React root and render the receipt
  const root = ReactDOM.createRoot(printContainer);
  root.render(React.createElement(ThermalReceipt, { order, isKtv, paperSize }));

  // Wait for the component to render, then trigger print
  // Use requestAnimationFrame to ensure DOM is ready
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Double check that the container has content
      const receiptElement = printContainer.querySelector(".thermal-receipt");
      if (receiptElement) {
        setTimeout(() => {
          window.print();

          // Clean up after printing
          setTimeout(() => {
            root.unmount();
            if (printContainer.parentNode) {
              printContainer.parentNode.removeChild(printContainer);
            }
            if (styleElement.parentNode) {
              styleElement.parentNode.removeChild(styleElement);
            }
          }, 1000);
        }, 300);
      } else {
        // If element not found, wait a bit more
        setTimeout(() => {
          window.print();
          setTimeout(() => {
            root.unmount();
            if (printContainer.parentNode) {
              printContainer.parentNode.removeChild(printContainer);
            }
            if (styleElement.parentNode) {
              styleElement.parentNode.removeChild(styleElement);
            }
          }, 1000);
        }, 800);
      }
    });
  });
};

export default printReceipt;
