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
import changeRestaurantOrderTable from "../../api/Order/changeRestaurantOrderTable";
import getAllTables from "../../api/Table/getAllTables";

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
    () => localStorage.getItem("receipt-paper-size") || "57mm",
  );
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [partialPayments, setPartialPayments] = useState([]);
  const [usePartialPayment, setUsePartialPayment] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isTableChangeOpen, setIsTableChangeOpen] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedNewTable, setSelectedNewTable] = useState("");

  // Handler for opening checkout modal
  const handleCheckoutClick = () => {
    setIsCheckoutModalOpen(true);
  };

  // Handler for closing checkout modal
  const handleCloseCheckoutModal = () => {
    setIsCheckoutModalOpen(false);
  };

  // Handler for opening table change modal
  const handleOpenTableChange = async () => {
    if (!orderId) {
      toast.error("No active order to change table");
      return;
    }

    try {
      // Fetch all tables from API
      const res = await getAllTables();

      if (res?.success && Array.isArray(res.data)) {
        // Filter out current table and deleted tables
        const availableTables = res.data.filter(
          (table) =>
            String(table.tableNumber) !== String(selectedTable) &&
            !table.isDeleted &&
            table.status !== "deleted",
        );

        setAvailableTables(availableTables);
        setSelectedNewTable("");
        setIsTableChangeOpen(true);
      } else {
        toast.error("No tables available");
      }
    } catch (error) {
      toast.error("Failed to load tables");
      console.error("Error loading tables:", error);
    }
  };

  // Handler for closing table change modal
  const handleCloseTableChange = () => {
    setIsTableChangeOpen(false);
    setSelectedNewTable("");
    setAvailableTables([]);
  };

  // Handler for changing table
  const handleChangeTable = async () => {
    if (!selectedNewTable) {
      toast.error("Please select a new table");
      return;
    }

    if (!orderId) {
      toast.error("No active order to change table");
      return;
    }

    try {
      const res = await changeRestaurantOrderTable(orderId, selectedNewTable);

      if (res?.success) {
        toast.success("Table changed successfully");

        try {
          // Update new table status to active
          await updateTableStatus({
            tableServiceId: selectedNewTable,
            status: "active",
          });

          // Update previous table status to inactive
          if (tableServiceId) {
            await updateTableStatus({
              tableServiceId: tableServiceId,
              status: "inactive",
            });
          }
        } catch (error) {
          // console.error("Failed to update table status:", error);
        }

        // Update local state with new table
        dispatch(removeTable(selectedTable));
        // Note: We don't set the new table as selected since the order is now associated with it
        // The user would need to select the new table from the table list to continue working on it

        handleCloseTableChange();

        // Optionally refresh the order data
        if (res?.data) {
          setRemoteOrder({
            ...res.data,
            tableService: {
              ...res.data.tableService,
              tableNumber: selectedNewTable,
            },
          });
        }
      }
    } catch (error) {
      toast.error("Failed to change table");
      console.error("Error changing table:", error);
    }
  };

  // Helper functions for partial payments
  const addPartialPayment = (method, amount) => {
    let finalAmount = Number(amount);

    // If FOC is selected, set amount to remaining amount and apply 100% discount
    if (method === "foc") {
      finalAmount = getRemainingAmount();
      // Apply 100% discount
      const subtotal = calculateSubtotal();
      const tax = calculateTax(subtotal);
      const serviceFeeAmount = calculateServiceFee(subtotal);
      const totalWithTaxAndFees = subtotal + tax + serviceFeeAmount;
      setDiscountAmount(totalWithTaxAndFees);
    }

    setPartialPayments([...partialPayments, { method, amount: finalAmount }]);
  };

  const removePartialPayment = (index) => {
    const removedPayment = partialPayments[index];
    setPartialPayments(partialPayments.filter((_, i) => i !== index));

    // If FOC payment is removed, reset the discount
    if (removedPayment && removedPayment.method === "foc") {
      setDiscountAmount(0);
    }
  };

  const updatePartialPayment = (index, field, value) => {
    const updated = [...partialPayments];
    updated[index] = {
      ...updated[index],
      [field]: field === "amount" ? Number(value) : value,
    };

    // If method is changed to FOC, set amount to remaining amount and apply 100% discount
    if (field === "method" && value === "foc") {
      updated[index].amount = getRemainingAmount();
      // Apply 100% discount
      const subtotal = calculateSubtotal();
      const tax = calculateTax(subtotal);
      const serviceFeeAmount = calculateServiceFee(subtotal);
      const totalWithTaxAndFees = subtotal + tax + serviceFeeAmount;
      setDiscountAmount(totalWithTaxAndFees);
    }

    // If method is changed away from FOC, reset the discount
    if (
      field === "method" &&
      updated[index].method !== "foc" &&
      partialPayments[index]?.method === "foc"
    ) {
      setDiscountAmount(0);
    }

    setPartialPayments(updated);
  };

  const getTotalPaidAmount = () => {
    return partialPayments.reduce((sum, payment) => {
      return sum + (payment.method === "foc" ? 0 : payment.amount);
    }, 0);
  };

  const getRemainingAmount = () => {
    const hasFoc =
      partialPayments.some((p) => p.method === "foc") ||
      paymentMethod === "foc";
    if (hasFoc) {
      // For FOC, remaining amount should be 0 since discount covers everything
      return 0;
    }
    return calculateTotal() - getTotalPaidAmount();
  };

  const isPaymentComplete = () => {
    const hasFoc =
      partialPayments.some((p) => p.method === "foc") ||
      paymentMethod === "foc";
    if (hasFoc) {
      // For FOC, payment is complete if discount covers the full amount
      return calculateTotal() === 0;
    }
    return Math.abs(getTotalPaidAmount() - calculateTotal()) < 0.01; // Allow for floating point precision
  };

  useEffect(() => {
    const fetchOrdersForTable = async () => {
      // console.log("selectedTable", selectedTable);
      if (!selectedTable) {
        setRemoteOrder(null);
        setOrderId(null);
        return;
      }
      setIsLoadingRemote(true);
      const res = await getRestaurantOrders({
        status: "pending",
        tableNumber: selectedTable,
      });
      // console.log(res);
      if (res?.success && Array.isArray(res.data)) {
        // Show pending orders, pick latest by createdAt
        const pick = (list) =>
          list
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] ||
          null;
        const chosen = pick(res.data);
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
            setItemsForTable({ table: selectedTable, items: mappedItems }),
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

  // Reset tableServiceId and payment method when table changes
  useEffect(() => {
    setTableServiceId(null);
    setPaymentMethod("cash"); // Reset to default payment method
    setPartialPayments([]); // Reset partial payments
    setUsePartialPayment(false); // Reset partial payment toggle
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

  // Handle FOC payment method - apply 100% discount when FOC is selected
  useEffect(() => {
    if (paymentMethod === "foc") {
      // Apply 100% discount for FOC
      const subtotal = calculateSubtotal();
      const tax = calculateTax(subtotal);
      const serviceFeeAmount = calculateServiceFee(subtotal);
      const totalWithTaxAndFees = subtotal + tax + serviceFeeAmount;
      setDiscountAmount(totalWithTaxAndFees);
    } else if (discountAmount > 0 && paymentMethod !== "foc") {
      // Reset discount if switching away from FOC and discount was applied
      setDiscountAmount(0);
    }
  }, [paymentMethod]);

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
              orderItem.quantity,
            );

            // Sum quantities for the same orderItemId
            const orderItemId = orderItem.orderItemId;
            if (itemsToRemoveMap.has(orderItemId)) {
              itemsToRemoveMap.set(
                orderItemId,
                itemsToRemoveMap.get(orderItemId) + removeFromThisItem,
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
        }),
      );

      // if (itemsToRemove.length === 0) {
      //   toast.info("No items to remove");
      //   handleCloseRemoveOrder();
      //   return;
      // }

      // console.log("itemsToRemove", itemsToRemove);

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
              setItemsForTable({ table: selectedTable, items: mappedItems }),
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
              o.status === "ongoing",
          );
          const pick = (list) =>
            list
              .slice()
              .sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
              )[0] || null;
          const chosen = pick(activeOrders);
          if (chosen) {
            setRemoteOrder(chosen);
            setOrderId(chosen._id);
          }
        }
      }
    } catch (error) {
      // console.error("Error updating order:", error);
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

    setIsCalculatorOpen(true);
  };

  const handleCalculatorConfirm = async ({ paidPrice, extraChange }) => {
    if (!orderId) {
      toast.error("No active order to checkout");
      return;
    }

    // Validate partial payments if enabled (skip for FOC)
    if (
      usePartialPayment &&
      !isPaymentComplete() &&
      !partialPayments.some((p) => p.method === "foc")
    ) {
      toast.error(
        `Payment incomplete. Total: ${calculateTotal()} MMK, Paid: ${getTotalPaidAmount()} MMK, Remaining: ${getRemainingAmount()} MMK`,
      );
      return;
    }
    const payload = {
      status: "completed",
      subTotal: calculateSubtotal(),
      tax: (taxRate / 100) * calculateSubtotal(),
      discount: calculateDiscount(),
      total: calculateTotal(),
      serviceFee: calculateServiceFee(calculateSubtotal()),
      paymentMethods: usePartialPayment
        ? partialPayments.map((payment) => ({
            paymentMethod: payment.method,
            paidAmount: payment.method === "foc" ? 0 : payment.amount,
          }))
        : [
            {
              paymentMethod: paymentMethod,
              paidAmount: paymentMethod === "foc" ? 0 : calculateTotal(),
            },
          ],
    };
    // console.log("payload", payload);
    try {
      const res = await checkoutOrder({ id: orderId, data: payload });
      if (res?.success) {
        console.log("res", res);
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
          paymentMethod: res?.data?.paymentMethod || paymentMethod,
          createdAt: res?.data?.createdAt || new Date().toISOString(),
          updatedAt: res?.data?.updatedAt || new Date().toISOString(),
        };

        // Print receipt
        const paperSize = localStorage.getItem("receipt-paper-size") || "57mm";
        printReceipt(orderForPrint, false, paperSize);

        setRemoteOrder(res?.data || null);
        setOrderId(null);
        if (tableServiceId) {
          try {
            await updateTableStatus({
              tableServiceId,
              status: "inactive",
            });
          } catch (error) {
            // console.error("Failed to reset table status:", error);
          }
        }
        if (selectedTable) {
          dispatch(removeTable(selectedTable));
        }

        if (onClose) onClose();
        navigate("/");
      }
    } catch (_) {
      // API layer toasts errors
    }
  };

  const handlePrintPreview = () => {
    // Check if there's data to print
    if (!selectedTable || !receipts[selectedTable]?.items?.length) {
      toast.warning("No items to print");
      return;
    }

    // Prepare order data for printing from current state (without checkout)
    const orderForPrint = {
      _id: orderId || `temp-${Date.now()}`,
      tableService: remoteOrder?.tableService || {
        tableServiceId: tableServiceId,
        tableNumber: selectedTable,
      },
      orderItems:
        receipts[selectedTable]?.items?.map((item) => ({
          ...item,
          stockName: item.stockName || item.name,
          price: item.price,
          quantity: item.quantity || 1,
          _id: item._id,
        })) || [],
      subTotal: calculateSubtotal(),
      tax: calculateTax(),
      serviceFee: calculateServiceFee(),
      discount: calculateDiscount(),
      total: calculateTotal(),
      status: "pending", // Show as pending since not checked out
      paymentMethods: null, // No payment methods for preview
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note: receipts[selectedTable]?.note || "",
    };

    // Print receipt
    const paperSize = localStorage.getItem("receipt-paper-size") || "57mm";
    printReceipt(orderForPrint, false, paperSize);
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
              setItemsForTable({ table: selectedTable, items: mappedItems }),
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
            // console.error("Failed to update table status:", error);
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
            setItemsForTable({ table: selectedTable, items: mappedItems }),
          );
        }
      }
    }
  };

  return (
    <div className="text-black h-screen px-3 pt-0">
      <div className="pt-2">
        <div className="flex justify-between w-full items-center mb-5">
          <p className="sub-header font-bold">Receipt</p>
          <div className="flex items-center gap-3">
            {/* <select
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
            </select> */}
            <button
              className="lg:hidden bg-white text-primary py-2 px-6 border border-primary rounded-full hover:bg-primary hover:text-white transition-colors"
              onClick={onClose}
            >
              Save
            </button>
            {hasLocalItems && (
              <button
                onClick={() => setIsSplitOpen(true)}
                className="bg-white text-primary py-2 px-6 border border-primary rounded-full hover:bg-primary hover:text-white transition-colors"
              >
                Split Order
              </button>
            )}
            {orderId && (
              <button
                onClick={handleOpenTableChange}
                className="bg-white text-primary py-2 px-6 border border-primary rounded-full hover:bg-primary hover:text-white transition-colors"
              >
                Change Table
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
              <div className="flex flex-col gap-3 pb-2">
                <div className="flex gap-3">
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
                  <button
                    onClick={handlePrintPreview}
                    disabled={
                      !selectedTable || !receipts[selectedTable]?.items?.length
                    }
                    className="flex-1 bg-white text-primary font-semibold py-4 rounded-full border border-primary hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Print preview without checkout"
                  >
                    Print Preview
                  </button>
                </div>

                {orderId && getUserRole() !== "restaurant-waiter" && (
                  <button
                    onClick={handleCheckoutClick}
                    className="flex-1 bg-primary text-white font-semibold py-4 rounded-full border border-primary hover:bg-primary/90 transition-colors"
                  >
                    Checkout
                  </button>
                )}
              </div>
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

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-lg font-bold">Checkout</h3>
              <button
                onClick={handleCloseCheckoutModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                <h4 className="font-semibold mb-3">Order Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      {calculateSubtotal().toLocaleString()} MMK
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Gov Tax:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={taxRate === 0 ? "" : taxRate}
                          onChange={handleTaxChange}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:border-primary"
                          min="0"
                          max="100"
                        />
                        <span className="text-gray-500">%</span>
                      </div>
                      <span className="font-medium text-gray-600">
                        {calculateTax(calculateSubtotal()).toLocaleString()} MMK
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Service Fee:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={serviceFee === 0 ? "" : serviceFee}
                          onChange={handleServiceFeeChange}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:border-primary"
                          min="0"
                          max="100"
                        />
                        <span className="text-gray-500">%</span>
                      </div>
                      <span className="font-medium text-gray-600">
                        {calculateServiceFee(
                          calculateSubtotal(),
                        ).toLocaleString()}{" "}
                        MMK
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Discount:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={discountAmount === 0 ? "" : discountAmount}
                        onChange={handleDiscountChange}
                        className="w-28 px-3 py-1 border border-gray-300 rounded-md text-right focus:outline-none focus:border-primary font-medium disabled:bg-gray-100 disabled:text-gray-500"
                        placeholder="0"
                        disabled={
                          paymentMethod === "foc" ||
                          partialPayments.some((p) => p.method === "foc")
                        }
                      />
                      <span className="text-gray-600 text-sm">MMK</span>
                    </div>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-bold text-lg">Total:</span>
                    <span className="font-bold text-lg text-primary">
                      {calculateTotal().toLocaleString()} MMK
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="partialPayment"
                    checked={usePartialPayment}
                    onChange={(e) => {
                      setUsePartialPayment(e.target.checked);
                      if (!e.target.checked) {
                        setPartialPayments([]);
                      }
                    }}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label
                    htmlFor="partialPayment"
                    className="text-sm font-medium text-gray-700"
                  >
                    Enable Partial Payment
                  </label>
                </div>

                {!usePartialPayment ? (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary bg-white"
                      required
                    >
                      <option value="cash">Cash</option>
                      <option value="kpay">KPay</option>
                      <option value="wavepay">WavePay</option>
                      <option value="foc">FOC (Free of Charge)</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700">
                      Payment Breakdown
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Total Amount:</span>
                        <span className="font-semibold">
                          {calculateTotal().toLocaleString()} MMK
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Paid Amount:</span>
                        <span className="font-semibold text-green-600">
                          {getTotalPaidAmount().toLocaleString()} MMK
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span>Remaining:</span>
                        <span
                          className={
                            getRemainingAmount() > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          {getRemainingAmount().toLocaleString()} MMK
                        </span>
                      </div>
                    </div>

                    {/* Payment Methods List */}
                    <div className="space-y-2">
                      {partialPayments.map((payment, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <select
                            value={payment.method}
                            onChange={(e) =>
                              updatePartialPayment(
                                index,
                                "method",
                                e.target.value,
                              )
                            }
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary"
                          >
                            <option value="cash">Cash</option>
                            <option value="kpay">KPay</option>
                            <option value="wavepay">WavePay</option>
                            <option value="foc">FOC (Free of Charge)</option>
                          </select>
                          <input
                            type="number"
                            value={payment.amount}
                            onChange={(e) =>
                              updatePartialPayment(
                                index,
                                "amount",
                                e.target.value,
                              )
                            }
                            placeholder="Amount"
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary disabled:bg-gray-100 disabled:text-gray-500"
                            min="0"
                            step="0.01"
                            disabled={payment.method === "foc"}
                          />
                          <button
                            onClick={() => removePartialPayment(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Payment Button */}
                    {getRemainingAmount() > 0 && (
                      <button
                        onClick={() => addPartialPayment("cash", 0)}
                        className="w-full py-2 px-3 border border-gray-200 rounded text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        Add Payment Method
                      </button>
                    )}

                    {/* Payment Status */}
                    <div
                      className={`p-2 rounded text-sm text-center ${
                        isPaymentComplete()
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                      }`}
                    >
                      {isPaymentComplete()
                        ? "✓ Payment Complete"
                        : `⚠ Payment Incomplete - ${getRemainingAmount().toLocaleString()} MMK remaining`}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-5">
              <div className="flex gap-3">
                <button
                  onClick={handleCloseCheckoutModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCalculatorConfirm}
                  disabled={usePartialPayment && !isPaymentComplete()}
                  className={`flex-1 px-4 py-2 rounded-lg text-white ${
                    usePartialPayment && !isPaymentComplete()
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  Complete Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Change Modal */}
      {isTableChangeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-lg font-bold">Change Table</h3>
              <button
                onClick={handleCloseTableChange}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Table:{" "}
                  <span className="text-primary font-bold">
                    {selectedTable}
                  </span>
                </label>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Table
                </label>
                <select
                  value={selectedNewTable}
                  onChange={(e) => setSelectedNewTable(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Select a table...</option>
                  {availableTables.map((table) => (
                    <option key={table._id} value={table._id}>
                      Table {table.tableNumber}{" "}
                      {table.status === "active" && "(Occupied)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-5">
              <div className="flex gap-3">
                <button
                  onClick={handleCloseTableChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeTable}
                  disabled={!selectedNewTable}
                  className={`flex-1 px-4 py-2 rounded-lg text-white ${
                    !selectedNewTable
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  Change Table
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
