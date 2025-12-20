import React from "react";

const ThermalReceipt = ({ order, isKtv = false, paperSize = "57mm" }) => {
  // Standard thermal paper sizes: 57mm, 58mm, 80mm
  // Parse paper width from paperSize string (e.g., "57mm" -> 57)
  const PAPER_WIDTH_MM = parseInt(paperSize) || 57;

  // Calculate printable width (accounting for ~4mm margins on each side)
  const PRINTABLE_WIDTH_MM = PAPER_WIDTH_MM - 9;

  // Adjust font sizes based on paper width - larger for better print visibility
  const isWide = PAPER_WIDTH_MM >= 80;
  const fontSize = {
    title: isWide ? "22px" : "20px",
    header: isWide ? "16px" : "14px",
    item: isWide ? "16px" : "14px",
    summary: isWide ? "15px" : "13px",
    total: isWide ? "18px" : "16px",
    footer: isWide ? "14px" : "12px",
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

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

  const getOrderItems = () => {
    if (order?.orderItems) {
      return order.orderItems;
    }
    return [];
  };

  const getSubtotal = () => {
    if (order?.subTotal != null) return Number(order.subTotal) || 0;
    const items = getOrderItems();
    return items.reduce((total, item) => {
      return total + (item.price || 0) * (item.quantity || 1);
    }, 0);
  };

  const getRoomCharges = () => {
    if (isKtv && order?.roomCharges != null) {
      return Number(order.roomCharges) || 0;
    }
    return 0;
  };

  const getVocalistCharges = () => {
    if (isKtv && order?.vocalistCharges != null) {
      return Number(order.vocalistCharges) || 0;
    }
    return 0;
  };

  const getTax = () => {
    if (order?.tax != null) {
      const taxValue = Number(order.tax) || 0;
      const base = getSubtotal() + getRoomCharges() + getVocalistCharges();

      // If tax is a percentage (0-100 range), calculate it
      if (taxValue >= 0 && taxValue <= 100) {
        return base * (taxValue / 100);
      }
      // If tax is already a calculated amount (greater than 100 or negative, treat as amount)
      // But also check if it's a decimal percentage (0-1 range)
      if (taxValue > 0 && taxValue < 1) {
        return base * taxValue;
      }
      // Otherwise, treat as already calculated amount
      return taxValue;
    }
    return 0;
  };

  const getTaxRate = () => {
    if (order?.tax != null) {
      const taxValue = Number(order.tax) || 0;
      const base = getSubtotal() + getRoomCharges() + getVocalistCharges();

      // If tax is a percentage (0-100 range), return it
      if (taxValue >= 0 && taxValue <= 100) {
        return taxValue.toFixed(0);
      }
      // If tax is a decimal percentage (0-1 range), convert to percentage
      if (taxValue > 0 && taxValue < 1) {
        return (taxValue * 100).toFixed(0);
      }
      // If tax is already calculated amount, calculate the percentage
      if (base > 0 && taxValue > 0) {
        return ((taxValue / base) * 100).toFixed(0);
      }
    }
    return "0";
  };

  const getServiceFee = () => {
    if (order?.serviceFee != null) {
      const serviceFeeValue = Number(order.serviceFee) || 0;
      const base = getSubtotal() + getRoomCharges() + getVocalistCharges();

      // If service fee is a percentage (0-100 range), calculate it
      if (serviceFeeValue >= 0 && serviceFeeValue <= 100) {
        return base * (serviceFeeValue / 100);
      }
      // If service fee is a decimal percentage (0-1 range), calculate it
      if (serviceFeeValue > 0 && serviceFeeValue < 1) {
        return base * serviceFeeValue;
      }
      // Otherwise, treat as already calculated amount
      return serviceFeeValue;
    }
    return 0;
  };

  const getServiceFeeRate = () => {
    if (order?.serviceFee != null) {
      const serviceFeeValue = Number(order.serviceFee) || 0;
      const base = getSubtotal() + getRoomCharges() + getVocalistCharges();

      // If service fee is a percentage (0-100 range), return it
      if (serviceFeeValue >= 0 && serviceFeeValue <= 100) {
        return serviceFeeValue.toFixed(0);
      }
      // If service fee is a decimal percentage (0-1 range), convert to percentage
      if (serviceFeeValue > 0 && serviceFeeValue < 1) {
        return (serviceFeeValue * 100).toFixed(0);
      }
      // If service fee is already calculated amount, calculate the percentage
      if (base > 0 && serviceFeeValue > 0) {
        return ((serviceFeeValue / base) * 100).toFixed(0);
      }
    }
    return "0";
  };

  const getDiscount = () => {
    if (order?.discount != null) {
      const discountValue = Number(order.discount) || 0;
      const base = getSubtotal() + getRoomCharges() + getVocalistCharges();

      // If discount is a percentage (0-100 range), calculate it
      if (discountValue >= 0 && discountValue <= 100) {
        return base * (discountValue / 100);
      }
      // If discount is a decimal percentage (0-1 range), calculate it
      if (discountValue > 0 && discountValue < 1) {
        return base * discountValue;
      }
      // Otherwise, treat as already calculated amount
      return discountValue;
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

  // Safety check - ensure we have order data
  if (!order) {
    return (
      <div
        className="thermal-receipt"
        style={{ padding: "5px", textAlign: "center" }}
      >
        <p>No order data available</p>
      </div>
    );
  }

  // For 57mm thermal paper - no pagination needed (continuous roll)
  // All items print on one continuous receipt
  const renderThermalReceipt = () => {
    return (
      <div
        className="thermal-receipt-page"
        style={{
          width: `${PAPER_WIDTH_MM}mm`,
          maxWidth: `${PAPER_WIDTH_MM}mm`,
          fontFamily: "'Courier New', monospace",
          fontSize: "9px",
          lineHeight: "1.2",
          backgroundColor: "white",
          color: "#000000",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1mm" }}>
          <h2
            style={{
              fontSize: fontSize.title,
              fontWeight: "900",
              marginBottom: "1mm",
              marginTop: "0",
              textTransform: "uppercase",
              letterSpacing: "0",
            }}
          >
            Nine Star
          </h2>
          <div
            style={{
              borderTop: "1px dashed #000",
              borderBottom: "1px dashed #000",
              padding: "0.5mm 0",
              margin: "1mm 0",
            }}
          >
            <p
              style={{
                margin: "1px 0",
                fontSize: fontSize.header,
                fontWeight: "900",
              }}
            >
              {isKtv
                ? `Room: ${getTableOrRoom()}`
                : `Table: ${getTableOrRoom()}`}
            </p>
            {order?.createdAt && (
              <p style={{ margin: "1px 0", fontSize: fontSize.item }}>
                {formatDate(order.createdAt)} {formatTime(order.createdAt)}
              </p>
            )}
            {order?._id && (
              <p
                style={{
                  margin: "1px 0",
                  fontSize: fontSize.footer,
                  opacity: 0.8,
                }}
              >
                #{order._id.slice(-8)}
              </p>
            )}
          </div>
        </div>

        {/* Items */}
        <div style={{ marginBottom: "2mm" }}>
          <div
            style={{
              borderBottom: "1px dashed #000",
              paddingBottom: "1mm",
              marginBottom: "2mm",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: fontSize.header,
                fontWeight: "900",
              }}
            >
              <span style={{ flex: "1", textAlign: "left" }}>Item</span>
              <span style={{ width: "55px", textAlign: "right" }}>Amt</span>
            </div>
          </div>

          {items.length > 0 ? (
            items.map((item, index) => (
              <div
                key={item._id || index}
                style={{
                  marginBottom: "1mm",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      flex: "1",
                      fontSize: fontSize.item,
                      wordBreak: "break-word",
                      paddingRight: "1mm",
                      textAlign: "left",
                      fontWeight: "700",
                    }}
                  >
                    {item.stockName || item.name || "Item"} x{" "}
                    {item.quantity || 1}
                  </span>
                  <span
                    style={{
                      width: "55px",
                      textAlign: "right",
                      fontSize: fontSize.item,
                      fontWeight: "700",
                    }}
                  >
                    {(
                      (item.price || 0) * (item.quantity || 1)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: "center", fontSize: fontSize.item }}>
              No items
            </p>
          )}
        </div>

        {/* Room Service - KTV orders */}
        {isKtv && getRoomCharges() > 0 && (
          <div
            style={{
              marginBottom: "1mm",
              paddingBottom: "1mm",
              borderBottom: "1px dashed #000",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: fontSize.summary,
              }}
            >
              <span>Room Service</span>
              <span style={{ fontWeight: "900" }}>
                {getRoomCharges().toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Vocalist Charges - KTV orders */}
        {isKtv && getVocalistCharges() > 0 && (
          <div
            style={{
              marginBottom: "1mm",
              paddingBottom: "1mm",
              borderBottom: "1px dashed #000",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: fontSize.summary,
              }}
            >
              <span>Vocalist</span>
              <span style={{ fontWeight: "    900" }}>
                {getVocalistCharges().toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Summary */}
        <div
          style={{
            borderTop: "1px dashed #000",
            borderBottom: "1px dashed #000",
            padding: "2mm 0",
            marginBottom: "2mm",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "1mm",
              fontSize: fontSize.summary,
            }}
          >
            <span>Subtotal</span>
            <span>{getSubtotal().toLocaleString()}</span>
          </div>

          {getDiscount() > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1mm",
                fontSize: fontSize.summary,
              }}
            >
              <span>Discount</span>
              <span style={{ fontWeight: "900" }}>
                -{getDiscount().toLocaleString()}
              </span>
            </div>
          )}

          {getTax() > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1mm",
                fontSize: fontSize.summary,
              }}
            >
              <span>Tax ({getTaxRate()}%)</span>
              <span>{getTax().toLocaleString()}</span>
            </div>
          )}

          {getServiceFee() > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1mm",
                fontSize: fontSize.summary,
              }}
            >
              <span>Svc ({getServiceFeeRate()}%)</span>
              <span>{getServiceFee().toLocaleString()}</span>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "2mm",
              paddingTop: "2mm",
              borderTop: "1px solid #000",
              fontSize: fontSize.total,
              fontWeight: "bold",
            }}
          >
            <span>TOTAL</span>
            <span>{getTotal().toLocaleString()} Ks</span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "2mm",
            paddingTop: "2mm",
            borderTop: "1px dashed #000",
            fontSize: fontSize.footer,
          }}
        >
          <p style={{ margin: "1mm 0", fontSize: fontSize.item }}>Thank you!</p>
          <p style={{ margin: "1mm 0", opacity: 0.7 }}>
            {order?.updatedAt &&
              `${formatDate(order.updatedAt)} ${formatTime(order.updatedAt)}`}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="thermal-receipt-container thermal-receipt">
      {renderThermalReceipt()}

      {/* Print Styles for 57mm Thermal Paper */}
      <style>{`
        @media print {
          @page {
            size: ${PAPER_WIDTH_MM}mm ${(() => {
        // Calculate height based on content - increased for larger fonts
        const baseHeight = 80;
        const itemsHeight = items.length * 6;
        const ktvExtra = isKtv ? 20 : 0;
        return baseHeight + itemsHeight + ktvExtra + 15;
      })()}mm;
            margin: 0;
            padding: 0;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            filter: contrast(200%) !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: ${PAPER_WIDTH_MM}mm !important;
            overflow: hidden !important;
          }
          body > *:not(#thermal-receipt-print-container) {
            display: none !important;
            visibility: hidden !important;
          }
          #thermal-receipt-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${PAPER_WIDTH_MM}mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            z-index: 99999 !important;
            overflow: hidden !important;
            page-break-after: always !important;
          }
          .thermal-receipt-container {
            width: ${PAPER_WIDTH_MM}mm !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
          .thermal-receipt-page {
            width: ${PAPER_WIDTH_MM}mm !important;
            max-width: ${PAPER_WIDTH_MM}mm !important;
            margin: 0 !important;
            padding: 1mm 0.5mm !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            color: #000000 !important;
            font-weight: bold !important;
            page-break-after: always !important;
            filter: contrast(200%) !important;
          }
        }
        @media screen {
          .thermal-receipt-container {
            display: flex;
            justify-content: center;
            padding: 20px;
            background: #f5f5f5;
          }
          .thermal-receipt-page {
            border: 1px solid #ccc;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            background: white;
          }
        }
      `}</style>
    </div>
  );
};

export default ThermalReceipt;
