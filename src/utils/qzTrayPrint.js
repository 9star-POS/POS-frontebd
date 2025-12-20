import qz from "qz-tray";
import html2canvas from "html2canvas";

// Default printer name - can be configured
const DEFAULT_PRINTER = "POS-58";

// QZ Tray connection state
let isConnecting = false;

/**
 * Connect to QZ Tray if not already connected
 */
export const connectQzTray = async () => {
  if (qz.websocket.isActive()) {
    return true;
  }

  if (isConnecting) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return qz.websocket.isActive();
  }

  try {
    isConnecting = true;
    await qz.websocket.connect();
    isConnecting = false;
    return true;
  } catch (err) {
    isConnecting = false;
    console.error("QZ Tray connection error:", err);
    return false;
  }
};

/**
 * Disconnect from QZ Tray
 */
export const disconnectQzTray = async () => {
  if (qz.websocket.isActive()) {
    await qz.websocket.disconnect();
  }
};

/**
 * Format number with thousand separators
 */
const formatNumber = (num) => {
  return Math.round(num || 0).toLocaleString();
};

/**
 * Format date for receipt
 */
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
};

/**
 * Format time for receipt
 */
const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Generate receipt HTML with Myanmar font support
 */
const generateReceiptHtml = (order, isKtv, pixelWidth) => {
  // Helper functions
  const getTableOrRoom = () => {
    if (isKtv) {
      return order?.roomService?.roomNumber || order?.roomNumber || "N/A";
    }
    return (
      order?.tableService?.tableNumber ||
      order?.tableNumber ||
      order?.table ||
      "N/A"
    );
  };

  const getOrderItems = () => order?.orderItems || [];

  const getSubtotal = () => {
    if (order?.subTotal != null) return Number(order.subTotal) || 0;
    return getOrderItems().reduce(
      (total, item) => total + (item.price || 0) * (item.quantity || 1),
      0
    );
  };

  const getRoomCharges = () =>
    isKtv && order?.roomCharges != null ? Number(order.roomCharges) || 0 : 0;
  const getVocalistCharges = () =>
    isKtv && order?.vocalistCharges != null
      ? Number(order.vocalistCharges) || 0
      : 0;

  const getTax = () => {
    if (order?.tax != null) {
      const taxValue = Number(order.tax) || 0;
      const base = getSubtotal() + getRoomCharges() + getVocalistCharges();
      if (taxValue >= 0 && taxValue <= 100) return base * (taxValue / 100);
      if (taxValue > 0 && taxValue < 1) return base * taxValue;
      return taxValue;
    }
    return 0;
  };

  const getTaxRate = () => {
    if (order?.tax != null) {
      const taxValue = Number(order.tax) || 0;
      if (taxValue >= 0 && taxValue <= 100) return taxValue.toFixed(0);
      if (taxValue > 0 && taxValue < 1) return (taxValue * 100).toFixed(0);
    }
    return "0";
  };

  const getServiceFee = () => {
    if (order?.serviceFee != null) {
      const val = Number(order.serviceFee) || 0;
      const base = getSubtotal() + getRoomCharges() + getVocalistCharges();
      if (val >= 0 && val <= 100) return base * (val / 100);
      if (val > 0 && val < 1) return base * val;
      return val;
    }
    return 0;
  };

  const getServiceFeeRate = () => {
    if (order?.serviceFee != null) {
      const val = Number(order.serviceFee) || 0;
      if (val >= 0 && val <= 100) return val.toFixed(0);
      if (val > 0 && val < 1) return (val * 100).toFixed(0);
    }
    return "0";
  };

  const getDiscount = () => {
    if (order?.discount != null) {
      const val = Number(order.discount) || 0;
      const base = getSubtotal() + getRoomCharges() + getVocalistCharges();
      if (val >= 0 && val <= 100) return base * (val / 100);
      if (val > 0 && val < 1) return base * val;
      return val;
    }
    return 0;
  };

  const getTotal = () => {
    if (order?.total != null) return Number(order.total) || 0;
    return (
      getSubtotal() +
      getRoomCharges() +
      getVocalistCharges() +
      getTax() +
      getServiceFee() -
      getDiscount()
    );
  };

  const items = getOrderItems();

  // Build items HTML
  let itemsHtml = "";
  if (items.length > 0) {
    items.forEach((item) => {
      const name = item.stockName || item.name || "Item";
      const qty = item.quantity || 1;
      const amount = formatNumber((item.price || 0) * qty);
      itemsHtml += `
        <div style="display:flex;justify-content:space-between;margin-bottom:2px;font-size:11px;">
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:4px;">${name}</span>
          <span style="width:24px;text-align:center;">${qty}</span>
          <span style="width:60px;text-align:right;">${amount}</span>
        </div>
      `;
    });
  } else {
    itemsHtml = '<div style="text-align:center;font-size:11px;">No items</div>';
  }

  // Build KTV charges HTML
  let ktvChargesHtml = "";
  if (isKtv && getRoomCharges() > 0) {
    ktvChargesHtml += `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Room Service</span><span>${formatNumber(
      getRoomCharges()
    )}</span></div>`;
  }
  if (isKtv && getVocalistCharges() > 0) {
    ktvChargesHtml += `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Vocalist</span><span>${formatNumber(
      getVocalistCharges()
    )}</span></div>`;
  }

  // Build summary HTML
  let summaryHtml = `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Subtotal</span><span>${formatNumber(
    getSubtotal()
  )}</span></div>`;
  if (getDiscount() > 0) {
    summaryHtml += `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Discount</span><span>-${formatNumber(
      getDiscount()
    )}</span></div>`;
  }
  if (getTax() > 0) {
    summaryHtml += `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Tax (${getTaxRate()}%)</span><span>${formatNumber(
      getTax()
    )}</span></div>`;
  }
  if (getServiceFee() > 0) {
    summaryHtml += `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Svc (${getServiceFeeRate()}%)</span><span>${formatNumber(
      getServiceFee()
    )}</span></div>`;
  }

  return `
    <div style="width:${pixelWidth}px;padding:8px;font-family:'Pyidaungsu','Myanmar Text','Noto Sans Myanmar',sans-serif;background:white;color:black;">
      <div style="text-align:center;margin-bottom:6px;">
        <div style="font-size:18px;font-weight:bold;">Nine Star</div>
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        <div style="font-size:14px;font-weight:bold;">${
          isKtv ? "Room" : "Table"
        }: ${getTableOrRoom()}</div>
        ${
          order?.createdAt
            ? `<div style="font-size:10px;">${formatDate(
                order.createdAt
              )} ${formatTime(order.createdAt)}</div>`
            : ""
        }
        ${
          order?._id
            ? `<div style="font-size:9px;opacity:0.7;">#${order._id.slice(
                -8
              )}</div>`
            : ""
        }
      </div>
      <div style="border-top:1px dashed #000;margin:6px 0;"></div>
      <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:11px;margin-bottom:4px;">
        <span style="flex:1;">Item</span>
        <span style="width:24px;text-align:center;">Qty</span>
        <span style="width:60px;text-align:right;">Amount</span>
      </div>
      <div style="border-top:1px dashed #000;margin:4px 0;"></div>
      ${itemsHtml}
      <div style="border-top:1px dashed #000;margin:6px 0;"></div>
      ${ktvChargesHtml}
      ${summaryHtml}
      <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:bold;margin-top:6px;padding-top:6px;border-top:1px solid #000;">
        <span>TOTAL</span>
        <span>${formatNumber(getTotal())} Ks</span>
      </div>
      <div style="text-align:center;margin-top:6px;padding-top:6px;border-top:1px dashed #000;">
        <div style="font-size:11px;">Thank you!</div>
        ${
          order?.updatedAt
            ? `<div style="font-size:9px;opacity:0.7;">${formatDate(
                order.updatedAt
              )} ${formatTime(order.updatedAt)}</div>`
            : ""
        }
      </div>
    </div>
  `;
};

/**
 * Render HTML to canvas using html2canvas
 */
const renderHtmlToCanvas = async (html, width) => {
  // Create a temporary container
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    // Wait a bit for fonts to load
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Render to canvas
    const canvas = await html2canvas(container.firstElementChild, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: width,
    });

    return canvas;
  } finally {
    document.body.removeChild(container);
  }
};

/**
 * Convert canvas to ESC/POS raster image commands
 */
const canvasToEscPosRaster = (canvas) => {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  const commands = [];
  const ESC = "\x1B";
  const GS = "\x1D";

  // Initialize printer
  commands.push(ESC + "@");

  // Set line spacing to 0 for continuous image
  commands.push(ESC + "3\x00");

  // Process image in 24-dot high strips
  for (let y = 0; y < height; y += 24) {
    // ESC * m nL nH - Select bit image mode
    // m = 33 (24-dot double density)
    const nL = width % 256;
    const nH = Math.floor(width / 256);

    commands.push(
      ESC + "*!" + String.fromCharCode(nL) + String.fromCharCode(nH)
    );

    for (let x = 0; x < width; x++) {
      let byte1 = 0,
        byte2 = 0,
        byte3 = 0;

      for (let bit = 0; bit < 8; bit++) {
        const row1 = y + bit;
        const row2 = y + bit + 8;
        const row3 = y + bit + 16;

        if (row1 < height) {
          const idx = (row1 * width + x) * 4;
          const gray =
            pixels[idx] * 0.299 +
            pixels[idx + 1] * 0.587 +
            pixels[idx + 2] * 0.114;
          if (gray < 128) byte1 |= 0x80 >> bit;
        }

        if (row2 < height) {
          const idx = (row2 * width + x) * 4;
          const gray =
            pixels[idx] * 0.299 +
            pixels[idx + 1] * 0.587 +
            pixels[idx + 2] * 0.114;
          if (gray < 128) byte2 |= 0x80 >> bit;
        }

        if (row3 < height) {
          const idx = (row3 * width + x) * 4;
          const gray =
            pixels[idx] * 0.299 +
            pixels[idx + 1] * 0.587 +
            pixels[idx + 2] * 0.114;
          if (gray < 128) byte3 |= 0x80 >> bit;
        }
      }

      commands.push(
        String.fromCharCode(byte1) +
          String.fromCharCode(byte2) +
          String.fromCharCode(byte3)
      );
    }

    commands.push("\n");
  }

  // Reset line spacing
  commands.push(ESC + "2");

  // Feed and cut
  commands.push("\n\n\n");
  commands.push(GS + "V\x00");

  return commands.join("");
};

/**
 * Print receipt using QZ Tray with html2canvas image rendering (supports Myanmar text)
 * @param {Object} order - Order data
 * @param {boolean} isKtv - Whether this is a KTV order
 * @param {string} paperSize - Paper size (57mm, 58mm, 80mm)
 * @param {string} printerName - Printer name (default: POS-58)
 */
export const printReceiptQzTray = async (
  order,
  isKtv = false,
  paperSize = "57mm",
  printerName = DEFAULT_PRINTER
) => {
  try {
    // Connect to QZ Tray
    const connected = await connectQzTray();
    if (!connected) {
      throw new Error("QZ Tray not connected. Make sure QZ Tray is running.");
    }

    const paperWidth = parseInt(paperSize) || 57;
    // Pixel width for thermal printer (8 dots/mm for 203 DPI)
    // 57mm * 8 = 456 pixels, but we use slightly less for margins
    const pixelWidth = paperWidth >= 80 ? 560 : 380;

    // Generate receipt HTML
    const html = generateReceiptHtml(order, isKtv, pixelWidth);

    // Render HTML to canvas using html2canvas
    const canvas = await renderHtmlToCanvas(html, pixelWidth);

    // Convert canvas to ESC/POS raster commands
    const escPosData = canvasToEscPosRaster(canvas);

    // Create printer config
    const config = qz.configs.create(printerName);

    // Send RAW data
    await qz.print(config, [escPosData]);

    console.log(
      "Receipt printed successfully via QZ Tray (with Myanmar support)"
    );
    return true;
  } catch (err) {
    console.error("QZ Tray print error:", err);
    throw err;
  }
};

export default printReceiptQzTray;
