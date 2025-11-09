import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { XCircle, Plus, Minus } from "lucide-react";
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
import checkoutOrder from "../../api/Order/checkout";
import SplitOrderModal from "../KTV/SplitOrderModal";
import getTableService from "../../api/Table/getTableService";
import printReceipt from "../../utils/printReceipt";

function Receipt({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedTable = useSelector((state) => state.receipts.selectedTable);
  const receipts = useSelector((state) => state.receipts.receipts);
  const [taxRate, setTaxRate] = useState(5); // Default 5% tax
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [remoteOrder, setRemoteOrder] = useState(null);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [isSplitOpen, setIsSplitOpen] = useState(false);
  const [tableServiceId, setTableServiceId] = useState(null);

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
      if (res?.code === 200 && Array.isArray(res.data)) {
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
      if (res?.code === 200 && res?.data?._id) {
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

  const handleTaxChange = (e) => {
    const value = e.target.value.replace(/^0+/, ""); // Remove leading zeros
    if (value === "" || (Number(value) >= 0 && Number(value) <= 100)) {
      setTaxRate(value === "" ? 0 : Number(value));
    }
  };

  const hasLocalItems =
    !!selectedTable && !!receipts[selectedTable]?.items?.length;

  const calculateSubtotal = () => {
    if (!selectedTable || !hasLocalItems) return 0;
    return receipts[selectedTable].items.reduce((total, item) => {
      return total + item.price * (item.quantity || 1);
    }, 0);
  };

  const calculateTax = (subtotal) => {
    return subtotal * (taxRate / 100);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    return subtotal + tax;
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
      tax: taxRate,
      discount: 0,
      total: calculateTotal(),
    };
    try {
      const res = await checkoutOrder({ id: orderId, data: payload });
      if (res?.status === "success" || res?.code === 200) {
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
          tax: res?.data?.tax || taxRate,
          discount: res?.data?.discount || 0,
          total: res?.data?.total || calculateTotal(),
          paymentMethod: "cash",
          createdAt: res?.data?.createdAt || new Date().toISOString(),
          updatedAt: res?.data?.updatedAt || new Date().toISOString(),
        };

        // Print receipt
        printReceipt(orderForPrint, false);

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
      if (res?.status === "success" || res?.code === 200) {
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
      if (res?.status === "success" || res?.code === 201) {
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

  const handleCheckout = async () => {
    if (!orderId) return;
    const payload = {
      status: "completed",
      subTotal: calculateSubtotal(),
      tax: taxRate,
      discount: 0,
      total: calculateTotal(),
    };
    try {
      const res = await checkoutOrder({ id: orderId, data: payload });
      if (res?.status === "success" || res?.code === 200) {
        toast.success("Checkout completed successfully");
        setRemoteOrder(res?.data || null);
        setOrderId(null);
        if (selectedTable) {
          dispatch(removeTable(selectedTable));
        }
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
        if (onClose) onClose();
      }
    } catch (_) {
      // error handled in API layer
    }
  };

  return (
    <div className="text-black h-screen px-3 pt-0">
      <div className="pt-2">
        <div className="flex justify-between w-full items-center mb-5">
          <p className="sub-header font-bold">Receipt</p>
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

            <div className="flex-1 overflow-y-auto mb-5 space-y-4">
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
                      <button
                        onClick={() => handleDecrement(item.name)}
                        className="p-1 rounded-md hover:bg-gray-100 text-primary"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-medium min-w-[24px] text-center">
                        {item.quantity || 1}
                      </span>
                      <button
                        onClick={() => handleIncrement(item.name)}
                        className="p-1 rounded-md hover:bg-gray-100 text-primary"
                      >
                        <Plus size={16} />
                      </button>
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

            <div className="sticky bottom-[0px] bg-white border-t">
              <div className="space-y-3 mb-4">
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
                  <button
                    onClick={sendKitchen}
                    className="flex-1 bg-white text-primary font-semibold py-4 rounded-full border border-primary hover:bg-gray-50 transition-colors"
                  >
                    Send to Kitchen
                  </button>
                  <button
                    onClick={() => setIsSplitOpen(true)}
                    className="flex-1 md:hidden bg-white text-primary font-semibold py-4 rounded-full border border-primary hover:bg-gray-50 transition-colors"
                  >
                    Split Order
                  </button>
                  {orderId && (
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
    </div>
  );
}

export default Receipt;
