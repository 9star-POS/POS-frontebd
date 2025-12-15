import React from "react";

const ThermalReceipt = ({ order, isKtv = false, paperSize = "A5" }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
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
        style={{ padding: "20px", textAlign: "center" }}
      >
        <p>No order data available</p>
      </div>
    );
  }

  // Pagination: Split items into pages (adjust by paper size)
  const PAGE_WIDTH_MM = paperSize === "A4" ? 210 : 148;
  const ITEMS_PER_PAGE = paperSize === "A4" ? 25 : 15;
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  const getItemsForPage = (pageIndex) => {
    const start = pageIndex * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return items.slice(start, end);
  };

  const renderReceiptPage = (pageIndex, pageItems, isLastPage) => {
    return (
      <div
        key={pageIndex}
        className="thermal-receipt-page"
        style={{
          width: `${PAGE_WIDTH_MM}mm`,
          maxWidth: `${PAGE_WIDTH_MM}mm`,
          margin: "0 auto",
          padding: "15mm 10mm",
          fontFamily: "monospace",
          fontSize: "14px",
          lineHeight: "1.5",
          backgroundColor: "white",
          color: "black",
          pageBreakAfter: isLastPage ? "auto" : "always",
          pageBreakInside: "avoid",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "4px",
              marginTop: "0",
              textTransform: "uppercase",
            }}
          >
            Nine Star
          </h2>
          <div
            style={{
              borderTop: "1px dashed #000",
              borderBottom: "1px dashed #000",
              padding: "3px 0",
              margin: "4px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p style={{ margin: "1px 0", fontSize: "12px" }}>
              {isKtv
                ? `Room: ${getTableOrRoom()}`
                : `Table: ${getTableOrRoom()}`}
            </p>
            {order?.createdAt && (
              <>
                <p style={{ margin: "1px 0", fontSize: "12px" }}>
                  Date: {formatDate(order.createdAt)}
                </p>
                <p style={{ margin: "1px 0", fontSize: "12px" }}>
                  Time: {formatTime(order.createdAt)}
                </p>
              </>
            )}
            {order?._id && (
              <p style={{ margin: "1px 0", fontSize: "11px", opacity: 0.7 }}>
                Order ID: {order._id.slice(-8)}
              </p>
            )}
          </div>
        </div>

        {/* Items */}
        <div style={{ marginBottom: "15px" }}>
          <div
            style={{
              borderBottom: "1px dashed #000",
              paddingBottom: "5px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              <span style={{ flex: "2" }}>Item</span>
              <span style={{ flex: "1", textAlign: "center" }}>Qty</span>
              <span style={{ flex: "1", textAlign: "right" }}>Price</span>
            </div>
          </div>

          {pageItems.length > 0 ? (
            pageItems.map((item, index) => (
              <div
                key={item._id || index}
                style={{
                  marginBottom: "8px",
                  paddingBottom: "8px",
                  borderBottom: "1px dotted #ccc",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "2px",
                  }}
                >
                  <span style={{ flex: "2", fontSize: "13px" }}>
                    {item.stockName || item.name || "Item"}
                  </span>
                  <span
                    style={{
                      flex: "1",
                      textAlign: "center",
                      fontSize: "13px",
                    }}
                  >
                    {item.quantity || 1}
                  </span>
                  <span
                    style={{
                      flex: "1",
                      textAlign: "right",
                      fontSize: "13px",
                    }}
                  >
                    {(
                      (item.price || 0) * (item.quantity || 1)
                    ).toLocaleString()}{" "}
                    MMK
                  </span>
                </div>
                {/* <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  <span style={{ flex: "2" }}>
                    {item.notes && `Note: ${item.notes}`}
                  </span>
                  <span
                    style={{
                      flex: "2",
                      textAlign: "right",
                      fontWeight: "bold",
                    }}
                  >
                    {(
                      (item.price || 0) * (item.quantity || 1)
                    ).toLocaleString()}{" "}
                    MMK
                  </span>
                </div> */}
              </div>
            ))
          ) : (
            <p style={{ textAlign: "center", fontSize: "11px" }}>No items</p>
          )}
        </div>

        {/* Show page number if multiple pages */}
        {totalPages > 1 && (
          <div
            style={{
              textAlign: "center",
              marginTop: "10px",
              marginBottom: "10px",
              fontSize: "11px",
              color: "#666",
            }}
          >
            Page {pageIndex + 1} of {totalPages}
          </div>
        )}

        {/* Show "Continued..." on pages after the first */}
        {pageIndex > 0 && (
          <div
            style={{
              textAlign: "center",
              marginBottom: "10px",
              paddingBottom: "10px",
              borderBottom: "1px dashed #000",
              fontSize: "12px",
              color: "#666",
              fontStyle: "italic",
            }}
          >
            (Continued from previous page...)
          </div>
        )}

        {/* Room Service - Hidden for KTV orders - Only show on first page */}
        {pageIndex === 0 && isKtv && getRoomCharges() > 0 && (
          <div
            style={{
              marginBottom: "10px",
              paddingBottom: "10px",
              borderBottom: "1px dashed #000",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
              }}
            >
              <span>Room Service</span>
              <span style={{ fontWeight: "bold" }}>
                {getRoomCharges().toLocaleString()} MMK
              </span>
            </div>
          </div>
        )}

        {/* Vocalist Charges - Hidden for KTV orders - Only show on first page */}
        {pageIndex === 0 && isKtv && getVocalistCharges() > 0 && (
          <div
            style={{
              marginBottom: "10px",
              paddingBottom: "10px",
              borderBottom: "1px dashed #000",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
              }}
            >
              <span>Vocalist Charges</span>
              <span style={{ fontWeight: "bold" }}>
                {getVocalistCharges().toLocaleString()} MMK
              </span>
            </div>
          </div>
        )}

        {/* Summary - Only show on last page */}
        {isLastPage && (
          <div
            style={{
              borderTop: "1px dashed #000",
              borderBottom: "1px dashed #000",
              padding: "10px 0",
              marginBottom: "15px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
                fontSize: "13px",
              }}
            >
              <span>Subtotal:</span>
              <span>{getSubtotal().toLocaleString()} MMK</span>
            </div>

            {getDiscount() > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                  fontSize: "13px",
                  color: "#666",
                }}
              >
                <span>Discount:</span>
                <span>-{getDiscount().toLocaleString()} MMK</span>
              </div>
            )}

            {getTax() > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                  fontSize: "13px",
                }}
              >
                <span>Gov Tax ({getTaxRate()}%):</span>
                <span>{getTax().toLocaleString()} MMK</span>
              </div>
            )}

            {getServiceFee() > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                  fontSize: "13px",
                }}
              >
                <span>Service Fee ({getServiceFeeRate()}%):</span>
                <span>{getServiceFee().toLocaleString()} MMK</span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "2px solid #000",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              <span>TOTAL:</span>
              <span>{getTotal().toLocaleString()} MMK</span>
            </div>
          </div>
        )}

        {/* Payment Method */}
        {/* {order?.paymentMethod && order.paymentMethod !== "none" && (
        <div
          style={{
            marginBottom: "15px",
            paddingBottom: "10px",
            borderBottom: "1px dashed #000",
            fontSize: "13px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Payment Method:</span>
            <span style={{ textTransform: "capitalize", fontWeight: "bold" }}>
              {order.paymentMethod}
            </span>
          </div>
        </div>
      )} */}

        {/* Footer - Only show on last page */}
        {isLastPage && (
          <div
            style={{
              textAlign: "center",
              marginTop: "20px",
              paddingTop: "15px",
              borderTop: "1px dashed #000",
              fontSize: "12px",
              color: "#666",
            }}
          >
            <p style={{ margin: "6px 0" }}>Thank you for your visit!</p>
            <p style={{ margin: "6px 0" }}>
              {order?.updatedAt &&
                `Printed: ${formatDate(order.updatedAt)} ${formatTime(
                  order.updatedAt
                )}`}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="thermal-receipt-container">
      {Array.from({ length: totalPages }, (_, index) => {
        const pageItems = getItemsForPage(index);
        const isLastPage = index === totalPages - 1;
        return renderReceiptPage(index, pageItems, isLastPage);
      })}

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: ${paperSize};
            margin: 0;
          }
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
            flex-direction: column !important;
            justify-content: flex-start !important;
            align-items: center !important;
            z-index: 99999 !important;
          }
          .thermal-receipt-container {
            width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          .thermal-receipt-page {
            position: relative !important;
            width: ${PAGE_WIDTH_MM}mm !important;
            max-width: ${PAGE_WIDTH_MM}mm !important;
            margin: 0 !important;
            padding: 15mm 10mm !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            color: black !important;
            font-size: 14px !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
          .thermal-receipt-page:last-child {
            page-break-after: auto !important;
          }
        }
        @media screen {
          .thermal-receipt-page {
            border: 1px solid #ccc;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default ThermalReceipt;
