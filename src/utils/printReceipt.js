import React from "react";
import ReactDOM from "react-dom/client";
import ThermalReceipt from "../components/ThermalReceipt";

/**
 * Combines duplicate items in orderItems by summing quantities and amounts
 * @param {Array} orderItems - Array of order items
 * @returns {Array} Combined order items
 */
const combineDuplicateItems = (orderItems) => {
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return [];
  }

  const grouped = new Map();

  orderItems.forEach((item) => {
    // Use stockId as primary key, fallback to name
    const key =
      item?.stockId?._id ||
      item?.stockId ||
      item?._id ||
      item?.stockName ||
      item?.name ||
      "";

    if (!key) return;

    if (grouped.has(key)) {
      const existing = grouped.get(key);
      // Sum quantities
      existing.quantity = (existing.quantity || 0) + (item.quantity || 1);
      // Keep the price (should be same for same item)
      existing.price = item.price || existing.price || 0;
    } else {
      // Create new entry
      grouped.set(key, {
        ...item,
        stockName: item.stockName || item.name || "Item",
        name: item.stockName || item.name || "Item",
        quantity: item.quantity || 1,
        price: item.price || 0,
        _id: item._id || item?.stockId?._id || item?.stockId || key,
        stockId: item.stockId || item._id || key,
      });
    }
  });

  return Array.from(grouped.values());
};

/**
 * Prints a thermal receipt for the given order
 * @param {Object} order - The order object to print
 * @param {boolean} isKtv - Whether this is a KTV order (default: false)
 * @param {string} paperSize - Paper size: "57mm", "58mm", "80mm" (default: "57mm")
 */
export const printReceipt = (order, isKtv = false, paperSize = "57mm") => {
  // Get paper width from size string
  const paperWidth = parseInt(paperSize) || 57;

  // Combine duplicate items before printing
  const combinedOrderItems = combineDuplicateItems(order?.orderItems || []);
  const orderWithCombinedItems = {
    ...order,
    orderItems: combinedOrderItems,
  };

  // Calculate estimated receipt height based on content
  // Base height for header, footer, summary sections (increased for better visibility)
  const baseHeight = 90; // mm for header, summary, footer
  // Height per item (approximately 7mm per item for larger fonts)
  const itemCount = combinedOrderItems.length;
  const itemsHeight = itemCount * 7;
  // Add extra for KTV charges if applicable
  const ktvExtra = isKtv ? 25 : 0;
  // Calculate total height with generous padding to ensure total is visible
  const estimatedHeight = baseHeight + itemsHeight + ktvExtra + 30; // 30mm extra padding

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

  // Inject thermal paper print styles - Continuous Roll (No Page Breaks)
  const styleElement = document.createElement("style");
  styleElement.id = "thermal-receipt-print-styles";
  styleElement.textContent = `
    @media print {
      @page {
        size: ${paperWidth}mm auto;
        margin: 0;
        padding: 0;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        page-break-inside: avoid !important;
        page-break-before: avoid !important;
        page-break-after: avoid !important;
        break-inside: avoid !important;
        break-before: avoid !important;
        break-after: avoid !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: ${paperWidth}mm !important;
        height: auto !important;
        overflow: visible !important;
      }
      body > *:not(#thermal-receipt-print-container) {
        display: none !important;
        visibility: hidden !important;
      }
      #thermal-receipt-print-container {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: ${paperWidth}mm !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        z-index: 99999 !important;
        overflow: visible !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .thermal-receipt-container {
        width: ${paperWidth}mm !important;
        height: auto !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .thermal-receipt-page {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
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
  root.render(
    React.createElement(ThermalReceipt, {
      order: orderWithCombinedItems,
      isKtv,
      paperSize,
    })
  );

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
