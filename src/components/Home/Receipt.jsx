import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Minus, X } from "lucide-react";
import {
  removeItemFromReceipt,
  incrementQuantity,
  decrementQuantity,
  removeTable,
} from "./../../redux/receiptSlice";
import { useNavigate } from "react-router-dom";
import box from "./../../assets/box.png";
import "./../input.css";
import CalculatorModal from "./CalculatorModel";
import sendToKitchen from "../../api/Order/sendtokitchen";
import updateTableStatus from "../../api/Table/updateTableStatus";
import { toast } from "sonner";
import getRestaurantOrders from "../../api/Order/getRestaurantOrders";
import { setItemsForTable } from "./../../redux/receiptSlice";
import updateKitchenOrder from "../../api/Order/updatetokitchenorder";
import removeOrderItems from "../../api/Order/removeOrderItems";
import checkoutOrder from "../../api/Order/checkout";
import SplitOrderModal from "../KTV/SplitOrderModal";
import getTableService from "../../api/Table/getTableService";
import printReceipt from "../../utils/printReceipt";
import { getUserRole } from "../../utils/getUserRole";

function Receipt({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedTable = useSelector((state) => state.receipts.selectedTable);
  const receipts = useSelector((state) => state.receipts.receipts);
  const [taxRate, setTaxRate] = useState(5); // Default 5% tax
  const [serviceFee, setServiceFee] = useState(2); // Default 2% service fee
  const [discountAmount, setDiscountAmount] = useState(0); // Default 0 MMK discount
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [remoteOrder, setRemoteOrder] = useState(null);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [isSplitOpen, setIsSplitOpen] = useState(false);
  const [isRemoveOrderOpen, setIsRemoveOrderOpen] = useState(false);
  const [orderItemsForRemove, setOrderItemsForRemove] = useState([]);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [tableServiceId, setTableServiceId] = useState(null);
  const [paperSize, setPaperSize] = useState(
    () => localStorage.getItem("receipt-paper-size") || "57mm"
  );

  useEffect(() => {
    const fetchOrdersForTable = async () => {
      console.log("selectedTable", selectedTable);
      if (!selectedTable) {
        setRemoteOrder(null);
        setOrderId(null);
        return;
      }
      setIsLoadingRemote(true);
      const res = await getRestaurantOrders();
      console.log(res);
      if (res?.success && Array.isArray(res.data)) {
        const forTable = res.data.filter((o) => {
          const tableNum = o.tableNumber || o.tableService?.tableNumber;
          return (
            Number(tableNum) === Number(selectedTable) && o?.isDeleted === false
          );
        });
        // Show pending or in_progress orders, pick latest by createdAt
        const pick = (list) =>
          list
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] ||
          null;
        // Filter for active orders (pending, in_progress, or ongoing)
        const activeOrders = forTable.filter(
          (o) =>
            o.status === "pending" ||
            o.status === "in_progress" ||
            o.status === "ongoing"
        );
        const chosen = pick(activeOrders);
        setRemoteOrder(chosen || null);
        setOrderId(chosen?._id || null);
        // Extract tableServiceId from order response if available
        if (chosen?.tableService?.tableServiceId) {
          setTableServiceId(chosen.tableService.tableServiceId);
        }
        if (chosen?.orderItems?.length) {
          // Group duplicate items (same stock) and sum quantities
          const grouped = new Map();
          chosen.orderItems.forEach((it) => {
            const key = it?.stockId?._id || it?.stockId;
            const name = it.stockName || it?.stockId?.name || "";
            const price = it.price || 0;
            const qty = it.quantity || 1;
            if (!key) return;
            if (!grouped.has(key)) {
              grouped.set(key, {
                name,
                price,
                quantity: qty,
                stockId: key,
                _id: key, // Add _id for consistency
              });
            } else {
              const existing = grouped.get(key);
              existing.quantity += qty;
              // Prefer latest price if it changes
              existing.price = price || existing.price;
            }
          });
          const mappedItems = Array.from(grouped.values());
          dispatch(
            setItemsForTable({ table: selectedTable, items: mappedItems })
          );
        } else {
          // No active order found
          dispatch(setItemsForTable({ table: selectedTable, items: [] }));
        }
      } else {
        setRemoteOrder(null);
        setOrderId(null);
      }
      setIsLoadingRemote(false);
    };
    fetchOrdersForTable();
  }, [selectedTable]);

  // Reset tableServiceId when table changes
  useEffect(() => {
    setTableServiceId(null);
  }, [selectedTable]);

  // Fetch table service ID when table is selected and no order exists
  useEffect(() => {
    const fetchTableService = async () => {
      // Only fetch if we have a table, no active order, and no tableServiceId yet
      if (!selectedTable || orderId || tableServiceId) return;
      const res = await getTableService(selectedTable);
      if (res?.success && res?.data?._id) {
        setTableServiceId(res.data._id);
      }
    };
    fetchTableService();
  }, [selectedTable, orderId, tableServiceId]);

  const handleRemoveItem = (itemName) => {
    dispatch(removeItemFromReceipt({ table: selectedTable, itemName }));
  };

  const handleIncrement = (itemName) => {
    dispatch(incrementQuantity({ table: selectedTable, itemName }));
  };

  const handleDecrement = (itemName) => {
    dispatch(decrementQuantity({ table: selectedTable, itemName }));
  };

  const handleOpenRemoveOrder = () => {
    if (!orderId || !remoteOrder) {
      toast.warning("No active order to remove items from");
      return;
    }
    // Group items by stockId and combine quantities
    const grouped = new Map();
    (remoteOrder.orderItems || []).forEach((item) => {
      const stockId = item?.stockId?._id || item?.stockId;
      const stockName = item.stockName || item?.stockId?.name || "";
      const price = item.price || 0;
      const qty = item.quantity || 1;
      const orderItemId = item._id;

      if (!stockId) return;

      if (!grouped.has(stockId)) {
        grouped.set(stockId, {
          stockId: stockId,
          stockName: stockName,
          price: price,
          quantity: qty,
          originalQuantity: qty,
          orderItemIds: [{ orderItemId, quantity: qty }], // Track individual order items
        });
      } else {
        const existing = grouped.get(stockId);
        existing.quantity += qty;
        existing.originalQuantity += qty;
        existing.orderItemIds.push({ orderItemId, quantity: qty });
      }
    });
    setOrderItemsForRemove(Array.from(grouped.values()));
    setIsRemoveOrderOpen(true);
  };

  const handleCloseRemoveOrder = () => {
    setIsRemoveOrderOpen(false);
    setOrderItemsForRemove([]);
  };

  const handleDecrementInModal = (index) => {
    const updatedItems = [...orderItemsForRemove];
    if (updatedItems[index].quantity > 0) {
      updatedItems[index].quantity -= 1;
    }
    // Keep item in list even if quantity is 0, so it remains visible
    setOrderItemsForRemove(updatedItems);
  };

  const handleIncrementInModal = (index) => {
    const updatedItems = [...orderItemsForRemove];
    if (updatedItems[index].quantity < updatedItems[index].originalQuantity) {
      updatedItems[index].quantity += 1;
    }
    setOrderItemsForRemove(updatedItems);
  };

  const handleSaveRemoveOrder = async () => {
    if (!orderId) {
      toast.error("No active order");
      return;
    }

    setIsUpdatingOrder(true);
    try {
      // Build array of items to remove with orderItemId and quantity
      // Group by orderItemId and sum quantities
      const itemsToRemoveMap = new Map();

      // Calculate items to remove
      orderItemsForRemove.forEach((item) => {
        const quantityToRemove = item.originalQuantity - item.quantity;
        if (quantityToRemove > 0) {
          // Distribute removal across orderItemIds
          let remainingToRemove = quantityToRemove;
          let orderItemIndex = 0;

          while (
            remainingToRemove > 0 &&
            orderItemIndex < item.orderItemIds.length
          ) {
            const orderItem = item.orderItemIds[orderItemIndex];
            const removeFromThisItem = Math.min(
              remainingToRemove,
              orderItem.quantity
            );

            // Sum quantities for the same orderItemId
            const orderItemId = orderItem.orderItemId;
            if (itemsToRemoveMap.has(orderItemId)) {
              itemsToRemoveMap.set(
                orderItemId,
                itemsToRemoveMap.get(orderItemId) + removeFromThisItem
              );
            } else {
              itemsToRemoveMap.set(orderItemId, removeFromThisItem);
            }

            remainingToRemove -= removeFromThisItem;
            orderItemIndex++;
          }
        }
      });

      // Convert map to array format
      const itemsToRemove = Array.from(itemsToRemoveMap.entries()).map(
        ([orderItemId, quantity]) => ({
          orderItemId,
          quantity,
        })
      );

      // if (itemsToRemove.length === 0) {
      //   toast.info("No items to remove");
      //   handleCloseRemoveOrder();
      //   return;
      // }

      console.log("itemsToRemove", itemsToRemove);

      const res = await removeOrderItems(orderId, itemsToRemove);

      if (res?.success) {
        toast.success(res?.message || "Order items removed successfully");
        handleCloseRemoveOrder();

        // Refresh the order data
        if (res?.data) {
          setRemoteOrder({
            ...res?.data,
            createdAt: res?.data?.createdAt || remoteOrder?.createdAt,
          });
          // Sync items from server response
          if (res?.data?.orderItems) {
            const grouped = new Map();
            res.data.orderItems.forEach((it) => {
              const key = it?.stockId?._id || it?.stockId;
              const name = it.stockName || it?.stockId?.name || "";
              const price = it.price || 0;
              const qty = it.quantity || 1;
              if (!key) return;
              if (!grouped.has(key)) {
                grouped.set(key, {
                  name,
                  price,
                  quantity: qty,
                  stockId: key,
                  _id: key,
                });
              } else {
                const existing = grouped.get(key);
                existing.quantity += qty;
                existing.price = price || existing.price;
              }
            });
            const mappedItems = Array.from(grouped.values());
            dispatch(
              setItemsForTable({ table: selectedTable, items: mappedItems })
            );
          }
        }

        // Refetch orders to sync
        const refreshRes = await getRestaurantOrders();
        if (refreshRes?.success && Array.isArray(refreshRes.data)) {
          const forTable = refreshRes.data.filter((o) => {
            const tableNum = o.tableNumber || o.tableService?.tableNumber;
            return (
              Number(tableNum) === Number(selectedTable) &&
              o?.isDeleted === false
            );
          });
          const activeOrders = forTable.filter(
            (o) =>
              o.status === "pending" ||
              o.status === "in_progress" ||
              o.status === "ongoing"
          );
          const pick = (list) =>
            list
              .slice()
              .sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
              )[0] || null;
          const chosen = pick(activeOrders);
          if (chosen) {
            setRemoteOrder(chosen);
            setOrderId(chosen._id);
          }
        }
      }
    } catch (error) {
      console.error("Error updating order:", error);
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const handleTaxChange = (e) => {
    const value = e.target.value.replace(/^0+/, ""); // Remove leading zeros
    if (value === "" || (Number(value) >= 0 && Number(value) <= 100)) {
      setTaxRate(value === "" ? 0 : Number(value));
    }
  };

  const handleServiceFeeChange = (e) => {
    const value = e.target.value.replace(/^0+/, ""); // Remove leading zeros
    if (value === "" || (Number(value) >= 0 && Number(value) <= 100)) {
      setServiceFee(value === "" ? 0 : Number(value));
    }
  };

  const handleDiscountChange = (e) => {
    const value = e.target.value.replace(/^0+/, ""); // Remove leading zeros
    if (value === "" || (Number(value) >= 0 && !isNaN(Number(value)))) {
      setDiscountAmount(value === "" ? 0 : Number(value));
    }
  };

  const hasLocalItems =
    !!selectedTable && !!receipts[selectedTable]?.items?.length;

  // Calculate how much quantity of an item has been sent to kitchen
  const getSentQuantity = (item) => {
    if (!remoteOrder?.orderItems || !orderId) return 0;
    const stockId = item._id || item.stockId;
    if (!stockId) return 0;

    // Sum up all quantities for this stockId in remote order
    let sentQty = 0;
    remoteOrder.orderItems.forEach((remoteItem) => {
      const remoteStockId = remoteItem?.stockId?._id || remoteItem?.stockId;
      if (remoteStockId === stockId) {
        sentQty += remoteItem.quantity || 1;
      }
    });
    return sentQty;
  };

  // Calculate local (unsent) quantity for an item
  const getLocalQuantity = (item) => {
    const currentQty = item.quantity || 1;
    const sentQty = getSentQuantity(item);
    return Math.max(0, currentQty - sentQty);
  };

  const calculateSubtotal = () => {
    if (!selectedTable || !hasLocalItems) return 0;
    return receipts[selectedTable].items.reduce((total, item) => {
      return total + item.price * (item.quantity || 1);
    }, 0);
  };

  const calculateTax = (subtotal) => {
    return subtotal * (taxRate / 100);
  };

  const calculateServiceFee = (subtotal) => {
    return subtotal * (serviceFee / 100);
  };

  const calculateDiscount = () => {
    // Return the fixed discount amount in MMK
    return discountAmount || 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = calculateTax(subtotal);
    const serviceFeeAmount = calculateServiceFee(subtotal);
    return subtotal - discount + tax + serviceFeeAmount;
  };

  const handlePayment = () => {
    if (!selectedTable || !receipts[selectedTable]?.items?.length) {
      return;
    }

    // const orderData = {
    //   table: selectedTable,
    //   orderType: receipts[selectedTable].orderType,
    //   orders: receipts[selectedTable].items.map((item) => ({
    //     dishName: item.name,
    //     price: item.price,
    //     quantity: item.quantity || 1,
    //   })),
    //   totalPrice: calculateSubtotal(),
    //   finalPrice: calculateTotal(),
    //   tax: taxRate / 100,
    // };

    setIsCalculatorOpen(true);
  };

  const handleCalculatorConfirm = async ({ paidPrice, extraChange }) => {
    if (!orderId) {
      toast.error("No active order to checkout");
      return;
    }
    const payload = {
      status: "completed",
      subTotal: calculateSubtotal(),
      tax: (taxRate / 100) * calculateSubtotal(),
      serviceFee: (serviceFee / 100) * calculateSubtotal(),
      discount: calculateDiscount(),
      total: calculateTotal(),
    };
    try {
      const res = await checkoutOrder({ id: orderId, data: payload });
      if (res?.success) {
        toast.success("Checkout completed successfully");
        setIsCalculatorOpen(false);

        // Prepare order data for printing
        const orderForPrint = {
          ...res?.data,
          tableService: res?.data?.tableService || {
            tableNumber: selectedTable,
          },
          tableNumber: selectedTable,
          table: selectedTable,
          orderItems:
            res?.data?.orderItems ||
            receipts[selectedTable]?.items?.map((item) => ({
              stockName: item.name,
              name: item.name,
              price: item.price,
              quantity: item.quantity || 1,
              _id: item._id || item.stockId,
            })) ||
            [],
          subTotal: res?.data?.subTotal || calculateSubtotal(),
          tax: res?.data?.tax || calculateTax(calculateSubtotal()),
          serviceFee:
            res?.data?.serviceFee || calculateServiceFee(calculateSubtotal()),
          discount: res?.data?.discount || calculateDiscount(),
          total: res?.data?.total || calculateTotal(),
          paymentMethod: "cash",
          createdAt: res?.data?.createdAt || new Date().toISOString(),
          updatedAt: res?.data?.updatedAt || new Date().toISOString(),
        };

        // Print receipt
        const paperSize = localStorage.getItem("receipt-paper-size") || "57mm";
        printReceipt(orderForPrint, false, paperSize);

        setRemoteOrder(res?.data || null);
        setOrderId(null);
        navigate("/");
        if (tableServiceId) {
          try {
            await updateTableStatus({
              tableServiceId,
              status: "inactive",
            });
          } catch (error) {
            console.error("Failed to reset table status:", error);
          }
        }
        if (selectedTable) {
          dispatch(removeTable(selectedTable));
        }

        if (onClose) onClose();
      }
    } catch (_) {
      // API layer toasts errors
    }
  };

  const sendKitchen = async () => {
    if (!selectedTable || !receipts[selectedTable]?.items?.length) {
      toast.warning("No items to send");
      return;
    }

    // Prepare local items snapshot
    const localItems = receipts[selectedTable].items.map((item) => ({
      stockId: item._id || item.stockId,
      quantity: item.quantity || 1,
      notes: item.notes ?? "",
      price: item.price,
      name: item.name,
    }));

    if (orderId) {
      // Compute delta: only send newly added quantities/items
      const remoteCounts = {};
      (remoteOrder?.orderItems || []).forEach((it) => {
        const key = it?.stockId?._id || it?.stockId;
        const qty = it?.quantity || 1;
        if (key) remoteCounts[key] = (remoteCounts[key] || 0) + qty;
      });

      const deltaItems = [];
      localItems.forEach((it) => {
        const key = it.stockId;
        const prevQty = remoteCounts[key] || 0;
        const addQty = (it.quantity || 0) - prevQty;
        if (addQty > 0) {
          deltaItems.push({ stockId: key, quantity: addQty, notes: it.notes });
        }
      });

      if (deltaItems.length === 0) {
        toast.info("No new items to send");
        return;
      }

      const updatePayload = { orderItems: deltaItems };
      const res = await updateKitchenOrder({
        data: updatePayload,
        id: orderId,
      });
      if (res?.success) {
        toast.success("Order updated in kitchen successfully");
        // Update remote order with full response if available
        if (res?.data) {
          setRemoteOrder({
            ...res?.data,
            createdAt: res?.data?.createdAt || remoteOrder?.createdAt,
          });
          // Sync items from server response with grouping
          if (res?.data?.orderItems) {
            // Group duplicate items (same stock) and sum quantities
            const grouped = new Map();
            res.data.orderItems.forEach((it) => {
              const key = it?.stockId?._id || it?.stockId;
              const name = it.stockName || it?.stockId?.name || "";
              const price = it.price || 0;
              const qty = it.quantity || 1;
              if (!key) return;
              if (!grouped.has(key)) {
                grouped.set(key, {
                  name,
                  price,
                  quantity: qty,
                  stockId: key,
                  _id: key,
                });
              } else {
                const existing = grouped.get(key);
                existing.quantity += qty;
                // Prefer latest price if it changes
                existing.price = price || existing.price;
              }
            });
            const mappedItems = Array.from(grouped.values());
            dispatch(
              setItemsForTable({ table: selectedTable, items: mappedItems })
            );
          }
        } else {
          // Fallback: keep baseline in sync to avoid resending the same items
          const syncedOrderItems = localItems.map((it) => ({
            stockId: it.stockId,
            quantity: it.quantity,
            notes: it.notes,
            price: it.price,
            stockName: it.name,
          }));
          setRemoteOrder((prev) => ({
            ...(prev || {}),
            orderItems: syncedOrderItems,
          }));
        }
      }
    } else {
      if (!tableServiceId) {
        toast.error("Table service not found");
        return;
      }

      const payload = {
        tableId: tableServiceId,
        orderItems: localItems.map((it) => ({
          stockId: it.stockId,
          quantity: it.quantity,
          notes: it.notes,
        })),
      };
      const res = await sendToKitchen(payload);
      if (res?.success) {
        toast.success("Order sent to kitchen successfully");
        const newOrderId = res?.data?._id;
        setOrderId(newOrderId);
        // Extract and store tableServiceId from response
        if (res?.data?.tableService?.tableServiceId) {
          const newTableServiceId = res.data.tableService.tableServiceId;
          setTableServiceId(newTableServiceId);
          try {
            await updateTableStatus({
              tableServiceId: newTableServiceId,
              status: "active",
            });
          } catch (error) {
            console.error("Failed to update table status:", error);
          }
        }

        // Update remote order state with full response from API
        setRemoteOrder({
          ...res?.data,
          createdAt: res?.data?.createdAt || new Date().toISOString(),
        });

        // Sync local state with server response - map items properly with grouping
        if (res?.data?.orderItems) {
          // Group duplicate items (same stock) and sum quantities
          const grouped = new Map();
          res.data.orderItems.forEach((it) => {
            const key = it?.stockId?._id || it?.stockId;
            const name = it.stockName || it?.stockId?.name || "";
            const price = it.price || 0;
            const qty = it.quantity || 1;
            if (!key) return;
            if (!grouped.has(key)) {
              grouped.set(key, {
                name,
                price,
                quantity: qty,
                stockId: key,
                _id: key,
              });
            } else {
              const existing = grouped.get(key);
              existing.quantity += qty;
              // Prefer latest price if it changes
              existing.price = price || existing.price;
            }
          });
          const mappedItems = Array.from(grouped.values());
          dispatch(
            setItemsForTable({ table: selectedTable, items: mappedItems })
          );
        }
      }
    }
  };

  // const handleCheckout = async () => {
  //   if (!orderId) return;
  //   const payload = {
  //     status: "completed",
  //     subTotal: calculateSubtotal(),
  //     tax: taxRate,
  //     discount: calculateDiscount(),
  //     total: calculateTotal(),
  //   };
  //   try {
  //     const res = await checkoutOrder({ id: orderId, data: payload });
  //     if (res?.status === "success" || res?.code === 200) {
  //       toast.success("Checkout completed successfully");
  //       setRemoteOrder(res?.data || null);
  //       setOrderId(null);
  //       if (selectedTable) {
  //         dispatch(removeTable(selectedTable));
  //       }
  //       if (tableServiceId) {
  //         try {
  //           await updateTableStatus({
  //             tableServiceId,
  //             status: "inactive",
  //           });
  //         } catch (error) {
  //           console.error("Failed to reset table status:", error);
  //         }
  //       }
  //       if (onClose) onClose();
  //     }
  //   } catch (_) {
  //     // error handled in API layer
  //   }
  // };

  return (
    <div className="text-black h-screen px-3 pt-0">
      <div className="pt-2">
        <div className="flex justify-between w-full items-center mb-5">
          <p className="sub-header font-bold">Receipt</p>
          <div className="flex items-center gap-3">
            <select
              value={paperSize}
              onChange={(e) => {
                const val = e.target.value;
                setPaperSize(val);
                localStorage.setItem("receipt-paper-size", val);
              }}
              className="border border-primary/40 text-primary bg-white rounded-md px-2 py-1 text-sm"
            >
              <option value="57mm">57mm Thermal</option>
              <option value="58mm">58mm Thermal</option>
              <option value="80mm">80mm Thermal</option>
            </select>
            <button
              className="md:hidden bg-white text-primary py-2 px-6 border border-primary rounded-full hover:bg-primary hover:text-white transition-colors"
              onClick={onClose}
            >
              Save
            </button>
            {hasLocalItems && (
              <button
                onClick={() => setIsSplitOpen(true)}
                className="hidden md:block bg-white text-primary py-2 px-6 border border-primary rounded-full hover:bg-primary hover:text-white transition-colors"
              >
                Split Order
              </button>
            )}
          </div>
        </div>

        {!selectedTable && (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <img src={box} alt="box" className="w-32 h-32 opacity-50" />
            <p className="text-gray-500 mt-5">No table selected</p>
          </div>
        )}

        {selectedTable && !hasLocalItems && (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <img src={box} alt="box" className="w-32 h-32 opacity-50" />
            <p className="text-gray-500 mt-5">No items in receipt</p>
          </div>
        )}

        {selectedTable && hasLocalItems && (
          <div className="flex flex-col h-[calc(100vh-10rem)]">
            <div className="flex justify-between items-center mb-3">
              <p className="text-gray-500">Table {selectedTable}</p>
              <p className="text-gray-500">
                {receipts[selectedTable].orderType}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto mb-2 space-y-4">
              {receipts[selectedTable].items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-white py-3 rounded-lg shadow-sm"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.price.toLocaleString()} MMK
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const localQty = getLocalQuantity(item);
                        const hasLocalQuantity = localQty > 0;
                        return (
                          <>
                            {hasLocalQuantity && (
                              <button
                                onClick={() => handleDecrement(item.name)}
                                className="p-1 rounded-md hover:bg-gray-100 text-primary"
                              >
                                <Minus size={16} />
                              </button>
                            )}
                            <span className="font-medium min-w-[24px] text-center">
                              {item.quantity || 1}
                            </span>
                            <button
                              onClick={() => handleIncrement(item.name)}
                              className="p-1 rounded-md hover:bg-gray-100 text-primary"
                            >
                              <Plus size={16} />
                            </button>
                          </>
                        );
                      })()}
                    </div>
                    <p className="font-medium min-w-[100px] text-right">
                      {(item.price * (item.quantity || 1)).toLocaleString()} MMK
                    </p>
                    {/* <button
                      onClick={() => handleRemoveItem(item.name)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <XCircle size={20} />
                    </button> */}
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-[-100px] md:bottom-[0] pb-2 bg-white border-t">
              <div className="space-y-3 my-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Subtotal</p>
                  <p className="font-medium">
                    {calculateSubtotal().toLocaleString()} MMK
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">Gov Tax</p>
                    <div className="relative">
                      <input
                        type="text"
                        value={taxRate === 0 ? "" : taxRate}
                        onChange={handleTaxChange}
                        className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:border-primary"
                        min="0"
                        max="100"
                      />
                      <span className="absolute right-[-22px] top-1/2 transform -translate-y-1/2 text-gray-500">
                        %
                      </span>
                    </div>
                  </div>
                  <p className="font-medium text-gray-600">
                    {calculateTax(calculateSubtotal()).toLocaleString()} MMK
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">Service Fee</p>
                    <div className="relative">
                      <input
                        type="text"
                        value={serviceFee === 0 ? "" : serviceFee}
                        onChange={handleServiceFeeChange}
                        className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:border-primary"
                        min="0"
                        max="100"
                      />
                      <span className="absolute right-[-22px] top-1/2 transform -translate-y-1/2 text-gray-500">
                        %
                      </span>
                    </div>
                  </div>
                  <p className="font-medium text-gray-600">
                    {calculateServiceFee(calculateSubtotal()).toLocaleString()}{" "}
                    MMK
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Discount</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={discountAmount === 0 ? "" : discountAmount}
                      onChange={handleDiscountChange}
                      className="w-28 px-3 py-1 border border-gray-300 rounded-md text-right focus:outline-none focus:border-primary font-medium"
                      placeholder="0"
                    />
                    <span className="text-gray-600 text-sm">MMK</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <p className="font-bold text-lg">Total</p>
                  <p className="font-bold text-lg text-primary">
                    {calculateTotal().toLocaleString()} MMK
                  </p>
                </div>
              </div>

              {/* <div className="flex gap-3 pb-5">
                <button
                  onClick={onClose}
                  className="flex-1 bg-white text-primary font-semibold py-4 rounded-full border border-primary hover:bg-gray-50 transition-colors"
                >
                  Order More
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 bg-primary text-white font-semibold py-4 rounded-full border border-primary hover:bg-primary/90 transition-colors"
                >
                  Payment
                </button>
              </div> */}
              {hasLocalItems && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-row gap-3">
                    <button
                      onClick={sendKitchen}
                      className="flex-1 bg-white text-primary font-semibold py-4 rounded-full border border-primary hover:bg-gray-50 transition-colors"
                    >
                      Send for Preparation
                    </button>
                    {orderId && (
                      <button
                        onClick={handleOpenRemoveOrder}
                        className="flex-1 bg-white text-primary font-semibold py-4 rounded-full border border-primary hover:bg-gray-50 transition-colors"
                      >
                        Remove Items
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setIsSplitOpen(true)}
                    className="flex-1 md:hidden bg-white text-primary font-semibold py-4 rounded-full border border-primary hover:bg-gray-50 transition-colors"
                  >
                    Split Order
                  </button>
                  {orderId && getUserRole() !== "restaurant-waiter" && (
                    <button
                      // onClick={handleCheckout}
                      onClick={handlePayment}
                      className="flex-1 bg-white text-primary font-semibold py-4 rounded-full border border-primary hover:bg-gray-50 transition-colors"
                    >
                      Checkout
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isCalculatorOpen && (
        <CalculatorModal
          total={calculateTotal()}
          onClose={() => setIsCalculatorOpen(false)}
          onConfirm={handleCalculatorConfirm}
        />
      )}
      {isSplitOpen && (
        <SplitOrderModal
          isOpen={isSplitOpen}
          onClose={() => setIsSplitOpen(false)}
          items={receipts[selectedTable]?.items || []}
          currency="MMK"
        />
      )}

      {/* Remove Order Items Modal */}
      {isRemoveOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-lg font-bold">Remove Items from Order</h3>
              <button
                onClick={handleCloseRemoveOrder}
                className="text-gray-500 hover:text-gray-700"
                disabled={isUpdatingOrder}
              >
                <X size={20} />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-5">
              {orderItemsForRemove.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No items in order
                </div>
              ) : (
                <div className="space-y-4">
                  {orderItemsForRemove.map((item, index) => (
                    <div
                      key={`${item.stockId}-${index}`}
                      className="flex justify-between items-center py-3 px-4 rounded-lg bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.stockName}</p>
                        <p className="text-sm text-gray-500">
                          {item.price.toLocaleString()} MMK
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDecrementInModal(index)}
                            className="p-1 rounded-md hover:bg-gray-200 text-primary"
                            disabled={item.quantity <= 0 || isUpdatingOrder}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-medium min-w-[24px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleIncrementInModal(index)}
                            className="p-1 rounded-md hover:bg-gray-200 text-primary"
                            disabled={
                              isUpdatingOrder ||
                              item.quantity >= item.originalQuantity
                            }
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <p className="font-medium min-w-[100px] text-right">
                          {(item.price * item.quantity).toLocaleString()} MMK
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-5">
              <div className="flex gap-3">
                <button
                  onClick={handleCloseRemoveOrder}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={isUpdatingOrder}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRemoveOrder}
                  disabled={isUpdatingOrder || orderItemsForRemove.length === 0}
                  className={`flex-1 px-4 py-2 rounded-lg text-white ${
                    isUpdatingOrder || orderItemsForRemove.length === 0
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {isUpdatingOrder ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Receipt;
