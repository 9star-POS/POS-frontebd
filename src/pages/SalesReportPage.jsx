import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import Calendar from "../components/Calender";
import getSaleReport from "../api/report/getSaleReport";
import getStockAnalytics from "../api/report/getStockAnalytics";
import getPaymentMethodReport from "../api/report/getPaymentMethodReport";
import { ArrowUpDown } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SalesSummaryPDF from "../components/Home/pdf/SalesSummaryPDF";
import StockAnalyticsPDF from "../components/Home/pdf/StockAnalyticsPDF";

const SalesReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [paymentMethodLoading, setPaymentMethodLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [paymentMethodData, setPaymentMethodData] = useState(null);
  const [activeTab, setActiveTab] = useState("sales"); // "sales", "analytics", or "paymentMethod"
  const [analyticsFilter, setAnalyticsFilter] = useState("all"); // all, restaurant, ktv
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all"); // all, restaurant, ktv
  const [sortConfig, setSortConfig] = useState({
    key: "totalQuantity",
    direction: "descending",
  });

  // Initialize dates from sessionStorage or default to today
  // sessionStorage automatically clears when browser closes, so it resets to today
  const [startDate, setStartDate] = useState(() => {
    const savedFilters = sessionStorage.getItem("salesReportDateRange");

    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        if (parsed.startDate && parsed.endDate) {
          return new Date(parsed.startDate);
        }
      } catch (e) {
        console.error("Error parsing saved date range:", e);
      }
    }

    return new Date();
  });

  const [endDate, setEndDate] = useState(() => {
    const savedFilters = sessionStorage.getItem("salesReportDateRange");

    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        if (parsed.startDate && parsed.endDate) {
          return new Date(parsed.endDate);
        }
      } catch (e) {
        console.error("Error parsing saved date range:", e);
      }
    }

    return new Date();
  });

  const handleDateChange = (dates) => {
    setStartDate(dates.startDate);
    setEndDate(dates.endDate);
    // Save to sessionStorage (clears when browser closes)
    const dateRange = {
      startDate: format(dates.startDate, "yyyy-MM-dd"),
      endDate: format(dates.endDate, "yyyy-MM-dd"),
    };
    sessionStorage.setItem("salesReportDateRange", JSON.stringify(dateRange));
  };

  const formatDisplayDate = (date) => {
    if (!date) return "";
    try {
      return format(new Date(date), "yyyy MMM dd");
    } catch {
      return String(date);
    }
  };

  const formatFileDate = (date) => {
    if (!date) return "unknown-date";
    try {
      return format(new Date(date), "yyyyMMdd");
    } catch {
      return "unknown-date";
    }
  };

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select a date range");
      return;
    }

    setLoading(true);
    try {
      const formattedStartDate = format(new Date(startDate), "yyyy-MM-dd");
      const formattedEndDate = format(new Date(endDate), "yyyy-MM-dd");

      const response = await getSaleReport({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      });
      // console.log("Sales Report Response:", response);
      if (response?.success) {
        setReportData(response.data);
        toast.success("Report generated successfully");
      } else {
        toast.error("Failed to generate report");
      }
    } catch (error) {
      toast.error("Error fetching sales report");
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select a date range");
      return;
    }

    setAnalyticsLoading(true);
    try {
      const formattedStartDate = format(new Date(startDate), "yyyy-MM-dd");
      const formattedEndDate = format(new Date(endDate), "yyyy-MM-dd");

      const response = await getStockAnalytics({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      });
      if (response?.success) {
        setAnalyticsData(response.data);
        toast.success("Analytics generated successfully");
      } else {
        toast.error("Failed to generate analytics");
      }
    } catch (error) {
      toast.error("Error fetching stock analytics");
      console.error("Error fetching analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchPaymentMethodReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select a date range");
      return;
    }

    setPaymentMethodLoading(true);
    try {
      const formattedStartDate = format(new Date(startDate), "yyyy-MM-dd");
      const formattedEndDate = format(new Date(endDate), "yyyy-MM-dd");

      const response = await getPaymentMethodReport({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      });
      if (response?.success) {
        setPaymentMethodData(response.data);
        toast.success("Payment method report generated successfully");
      } else {
        toast.error("Failed to generate payment method report");
      }
    } catch (error) {
      toast.error("Error fetching payment method report");
      console.error("Error fetching payment method report:", error);
    } finally {
      setPaymentMethodLoading(false);
    }
  };

  const generateReport = () => {
    if (activeTab === "sales") {
      fetchReport();
    } else if (activeTab === "analytics") {
      fetchAnalytics();
    } else if (activeTab === "paymentMethod") {
      fetchPaymentMethodReport();
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      generateReport();
    }
  }, [activeTab, startDate, endDate]);

  const analyticsItems = analyticsData?.analytics || [];

  const filteredAnalyticsItems = useMemo(() => {
    if (!analyticsItems.length) return [];
    if (analyticsFilter === "restaurant") {
      return analyticsItems.filter(
        (item) => (item.restaurantQuantity ?? 0) > 0
      );
    }
    if (analyticsFilter === "ktv") {
      return analyticsItems.filter(
        (item) =>
          (item.restaurantQuantity ?? 0) === 0 &&
          (item.ktvQuantity ?? item.totalQuantity ?? 0) > 0
      );
    }
    return analyticsItems;
  }, [analyticsFilter, analyticsItems]);

  const filteredSummary = useMemo(() => {
    if (!analyticsData) {
      return { totalUniqueStocks: 0, totalItemsSold: 0, totalRevenue: 0 };
    }

    if (analyticsFilter === "all") {
      if (analyticsData.summary) return analyticsData.summary;
      const totalItemsSold = analyticsItems.reduce(
        (acc, item) => acc + (item.totalQuantity ?? 0),
        0
      );
      const totalRevenue = analyticsItems.reduce(
        (acc, item) => acc + (item.totalRevenue ?? 0),
        0
      );
      return {
        totalUniqueStocks: analyticsItems.length,
        totalItemsSold,
        totalRevenue,
      };
    }

    const items = filteredAnalyticsItems;
    const totalItemsSold = items.reduce((acc, item) => {
      if (analyticsFilter === "restaurant") {
        return acc + (item.restaurantQuantity ?? 0);
      }
      return acc + (item.ktvQuantity ?? 0);
    }, 0);

    const totalRevenue = items.reduce((acc, item) => {
      if (analyticsFilter === "restaurant") {
        if (typeof item.restaurantRevenue === "number") {
          return acc + item.restaurantRevenue;
        }
        if (typeof item.totalRevenue === "number") {
          const ktvRevenue = Number(item.ktvRevenue ?? 0);
          return acc + Math.max(item.totalRevenue - ktvRevenue, 0);
        }
        return acc;
      }

      // KTV filter
      if (typeof item.ktvRevenue === "number") {
        return acc + item.ktvRevenue;
      }
      if (typeof item.totalRevenue === "number") {
        const restaurantRevenue = Number(item.restaurantRevenue ?? 0);
        return acc + Math.max(item.totalRevenue - restaurantRevenue, 0);
      }
      return acc;
    }, 0);

    return {
      totalUniqueStocks: items.length,
      totalItemsSold,
      totalRevenue,
    };
  }, [analyticsData, analyticsItems, analyticsFilter, filteredAnalyticsItems]);

  const ReportCard = ({ title, data }) => {
    // Handle both combined and individual order data structures
    const orderCount =
      data.totalOrderCount !== undefined
        ? data.totalOrderCount
        : data.orderCount || 0;
    const totalAmount =
      data.totalTotal !== undefined ? data.totalTotal : data.total || 0;

    return (
      <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-3 md:p-4">
        <h3 className="text-base md:text-lg font-semibold mb-2">{title}</h3>
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <div>
            <p className="text-xs md:text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl md:text-[36px] font-futura">{orderCount}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-500">Total Amount</p>
            <p className="text-2xl md:text-[36px] font-futura text-primary break-words">
              {Number(totalAmount).toLocaleString()} MMK
            </p>
          </div>
        </div>
      </div>
    );
  };

  const AnalyticsSummaryCard = ({ data }) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-3 md:p-4">
          <h3 className="text-sm md:text-lg font-semibold mb-1 md:mb-2">
            Unique Items
          </h3>
          <p className="text-2xl md:text-[36px] font-futura">
            {data?.totalUniqueStocks || 0}
          </p>
          <p className="text-xs md:text-sm text-gray-500">
            Different items sold
          </p>
        </div>
        <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-3 md:p-4">
          <h3 className="text-sm md:text-lg font-semibold mb-1 md:mb-2">
            Total Quantity
          </h3>
          <p className="text-2xl md:text-[36px] font-futura">
            {data?.totalItemsSold || 0}
          </p>
          <p className="text-xs md:text-sm text-gray-500">Items sold</p>
        </div>
        <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-3 md:p-4 sm:col-span-2 lg:col-span-1">
          <h3 className="text-sm md:text-lg font-semibold mb-1 md:mb-2">
            Total Revenue
          </h3>
          <p className="text-2xl md:text-[36px] font-futura text-primary break-words">
            {Number(data?.totalRevenue || 0).toLocaleString()} MMK
          </p>
          <p className="text-xs md:text-sm text-gray-500">Revenue generated</p>
        </div>
      </div>
    );
  };

  const sortData = (data) => {
    if (!data) return [];

    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
  };

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="p-3 md:p-5 h-[calc(100vh-90px)] overflow-y-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-5 gap-3">
        <h1 className="sub-header font-bold text-xl md:text-2xl">Reports</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 md:gap-4 flex-wrap md:justify-end">
          <Calendar
            sendDate={handleDateChange}
            selectedStartDate={startDate}
            selectedEndDate={endDate}
            defaultStartDate={new Date()}
            defaultEndDate={new Date()}
          />
          {activeTab === "sales" && reportData && (
            <PDFDownloadLink
              document={
                <SalesSummaryPDF
                  reportData={reportData}
                  startDate={startDate}
                  endDate={endDate}
                />
              }
              fileName={`sales-report-${formatFileDate(
                startDate
              )}-${formatFileDate(endDate)}.pdf`}
              className="bg-white border border-primary text-primary px-3 md:px-4 py-2 rounded-lg font-semibold hover:bg-prilight transition-colors text-sm md:text-base text-center"
            >
              {({ loading: pdfLoading }) =>
                pdfLoading ? "Preparing PDF..." : "Download Sales PDF"
              }
            </PDFDownloadLink>
          )}
          {activeTab === "analytics" && analyticsData && (
            <PDFDownloadLink
              document={
                <StockAnalyticsPDF
                  analyticsData={analyticsData}
                  startDate={startDate}
                  endDate={endDate}
                />
              }
              fileName={`stock-analytics-${formatFileDate(
                startDate
              )}-${formatFileDate(endDate)}.pdf`}
              className="bg-white border border-primary text-primary px-3 md:px-4 py-2 rounded-lg font-semibold hover:bg-prilight transition-colors text-sm md:text-base text-center"
            >
              {({ loading: pdfLoading }) =>
                pdfLoading ? "Preparing PDF..." : "Download Analytics PDF"
              }
            </PDFDownloadLink>
          )}
          <button
            onClick={generateReport}
            className="bg-primary text-white px-4 md:px-8 py-2 rounded-lg hover:opacity-90 transition-colors font-semibold text-sm md:text-base"
            disabled={
              activeTab === "sales"
                ? loading
                : activeTab === "analytics"
                ? analyticsLoading
                : paymentMethodLoading
            }
          >
            {activeTab === "sales"
              ? loading
                ? "Loading..."
                : "Generate Report"
              : activeTab === "analytics"
              ? analyticsLoading
                ? "Loading..."
                : "Generate Report"
              : paymentMethodLoading
              ? "Loading..."
              : "Generate Report"}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4 md:mb-5 overflow-x-auto">
        <button
          className={`px-4 md:px-6 py-2 md:py-3 font-semibold transition-all text-sm md:text-base whitespace-nowrap ${
            activeTab === "sales"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("sales")}
        >
          Sales Report
        </button>
        <button
          className={`px-4 md:px-6 py-2 md:py-3 font-semibold transition-all text-sm md:text-base whitespace-nowrap ${
            activeTab === "analytics"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("analytics")}
        >
          Stock Analytics
        </button>
        <button
          className={`px-4 md:px-6 py-2 md:py-3 font-semibold transition-all text-sm md:text-base whitespace-nowrap ${
            activeTab === "paymentMethod"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("paymentMethod")}
        >
          Payment Method
        </button>
      </div>

      {/* Date Range Display */}
      {/* {(activeTab === "sales" ? reportData : analyticsData) && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <h2 className="text-lg font-semibold mb-2">Date Range</h2>
          <p>
            From:{" "}
            <span className="font-medium">
              {activeTab === "sales"
                ? reportData?.dateRange.startDate
                : analyticsData?.dateRange.startDate}
            </span>{" "}
            To:{" "}
            <span className="font-medium">
              {activeTab === "sales"
                ? reportData?.dateRange.endDate
                : analyticsData?.dateRange.endDate}
            </span>
          </p>
        </div>
      )} */}

      {/* Sales Report Tab Content */}
      {activeTab === "sales" && (
        <>
          {reportData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
              <ReportCard
                title="Restaurant Orders"
                data={reportData.restaurantOrders}
              />
              <ReportCard title="KTV Orders" data={reportData.ktvOrders} />
              <ReportCard title="Combined Total" data={reportData.combined} />
            </div>
          )}

          {!reportData && !loading && (
            <div className="text-center py-10">
              <p className="text-gray-500">
                No report data available. Please select a date range and
                generate a report.
              </p>
            </div>
          )}

          {loading && (
            <div className="text-center py-10">
              <p className="text-gray-500">Loading report data...</p>
            </div>
          )}
        </>
      )}

      {/* Stock Analytics Tab Content */}
      {activeTab === "analytics" && (
        <>
          {analyticsData && (
            <div>
              <div className="flex flex-wrap gap-2 md:gap-3 mb-4">
                {[
                  { key: "all", label: "All" },
                  { key: "restaurant", label: "Restaurant" },
                  { key: "ktv", label: "KTV" },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setAnalyticsFilter(option.key)}
                    className={`px-3 md:px-4 py-2 rounded-lg border font-semibold transition-all text-sm md:text-base ${
                      analyticsFilter === option.key
                        ? "bg-primary text-white border-primary"
                        : "border-gray-300 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <AnalyticsSummaryCard data={filteredSummary} />

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[calc(100vh-470px)]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Item Name
                        </th>
                        <th
                          scope="col"
                          className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => requestSort("totalQuantity")}
                        >
                          <div className="flex items-center">
                            Quantity
                            <ArrowUpDown size={14} className="ml-1" />
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => requestSort("totalRevenue")}
                        >
                          <div className="flex items-center">
                            Revenue
                            <ArrowUpDown size={14} className="ml-1" />
                          </div>
                        </th>
                        {analyticsFilter !== "ktv" && (
                          <th
                            scope="col"
                            className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Restaurant
                          </th>
                        )}
                        {analyticsFilter !== "restaurant" && (
                          <th
                            scope="col"
                            className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            KTV
                          </th>
                        )}
                        <th
                          scope="col"
                          className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => requestSort("orderCount")}
                        >
                          <div className="flex items-center">
                            Orders
                            <ArrowUpDown size={14} className="ml-1" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortData(filteredAnalyticsItems).map((item) => (
                        <tr key={item.stockId} className="hover:bg-gray-50">
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.stockName}
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.totalQuantity}
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-primary">
                              {Number(item.totalRevenue || 0).toLocaleString()}{" "}
                              MMK
                            </div>
                          </td>
                          {analyticsFilter !== "ktv" && (
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {item.restaurantQuantity}
                              </div>
                            </td>
                          )}
                          {analyticsFilter !== "restaurant" && (
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {item.ktvQuantity}
                              </div>
                            </td>
                          )}
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.orderCount}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3 p-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {sortData(filteredAnalyticsItems).map((item) => (
                    <div
                      key={item.stockId}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-base font-semibold text-gray-900 flex-1 min-w-0 pr-2">
                          {item.stockName}
                        </h3>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            {Number(item.totalRevenue || 0).toLocaleString()}{" "}
                            MMK
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Quantity</p>
                          <p className="font-semibold text-gray-900">
                            {item.totalQuantity}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Orders</p>
                          <p className="font-semibold text-gray-900">
                            {item.orderCount}
                          </p>
                        </div>
                        {analyticsFilter !== "ktv" && (
                          <div>
                            <p className="text-gray-500 mb-1">Restaurant</p>
                            <p className="font-semibold text-gray-900">
                              {item.restaurantQuantity}
                            </p>
                          </div>
                        )}
                        {analyticsFilter !== "restaurant" && (
                          <div>
                            <p className="text-gray-500 mb-1">KTV</p>
                            <p className="font-semibold text-gray-900">
                              {item.ktvQuantity}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!analyticsData && !analyticsLoading && (
            <div className="text-center py-10">
              <p className="text-gray-500">
                No analytics data available. Please select a date range and
                generate a report.
              </p>
            </div>
          )}

          {analyticsLoading && (
            <div className="text-center py-10">
              <p className="text-gray-500">Loading analytics data...</p>
            </div>
          )}
        </>
      )}

      {/* Payment Method Report Tab Content */}
      {activeTab === "paymentMethod" && (
        <>
          {paymentMethodData && (
            <div>
              <div className="flex flex-wrap gap-2 md:gap-3 mb-4">
                {[
                  { key: "all", label: "All" },
                  { key: "restaurant", label: "Restaurant" },
                  { key: "ktv", label: "KTV" },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setPaymentMethodFilter(option.key)}
                    className={`px-3 md:px-4 py-2 rounded-lg border font-semibold transition-all text-sm md:text-base ${
                      paymentMethodFilter === option.key
                        ? "bg-primary text-white border-primary"
                        : "border-gray-300 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                {paymentMethodData.byPaymentMethod?.map((item, index) => {
                  // Filter out payment methods with no data for the selected filter
                  if (paymentMethodFilter === "restaurant") {
                    if ((item.restaurantOrders?.orderCount || 0) === 0) {
                      return null;
                    }
                  }
                  if (paymentMethodFilter === "ktv") {
                    if ((item.ktvOrders?.orderCount || 0) === 0) {
                      return null;
                    }
                  }
                  const getPaymentMethodLabel = () => {
                    if (item.paymentMethod === "wavepay") return "WavePay";
                    if (item.paymentMethod === "foc") return "FOC";
                    if (item.paymentMethod === "none") return "None";
                    return item.paymentMethod.toUpperCase();
                  };

                  const getPaymentMethodColor = () => {
                    if (item.paymentMethod === "cash")
                      return "border-green-500";
                    if (item.paymentMethod === "kpay") return "border-blue-500";
                    if (item.paymentMethod === "wavepay")
                      return "border-purple-500";
                    if (item.paymentMethod === "foc")
                      return "border-orange-500";
                    return "border-primary";
                  };

                  return (
                    <div
                      key={index}
                      className={`border-l-4 ${getPaymentMethodColor()} bg-white rounded-lg shadow-md p-3 md:p-4`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base md:text-lg font-semibold">
                          {getPaymentMethodLabel()}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.paymentMethod === "cash"
                              ? "bg-green-100 text-green-800"
                              : item.paymentMethod === "kpay"
                              ? "bg-blue-100 text-blue-800"
                              : item.paymentMethod === "wavepay"
                              ? "bg-purple-100 text-purple-800"
                              : item.paymentMethod === "foc"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {getPaymentMethodLabel()}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {/* Restaurant Orders */}
                        {(paymentMethodFilter === "all" ||
                          paymentMethodFilter === "restaurant") && (
                          <div className="border-b border-gray-200 pb-2">
                            <p className="text-xs md:text-sm text-gray-500 mb-1">
                              Restaurant Orders
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs text-gray-400">Orders</p>
                                <p className="text-lg md:text-xl font-futura">
                                  {item.restaurantOrders?.orderCount || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Total</p>
                                <p className="text-lg md:text-xl font-futura text-primary">
                                  {Number(
                                    item.restaurantOrders?.total || 0
                                  ).toLocaleString()}{" "}
                                  MMK
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* KTV Orders */}
                        {(paymentMethodFilter === "all" ||
                          paymentMethodFilter === "ktv") && (
                          <div className="border-b border-gray-200 pb-2">
                            <p className="text-xs md:text-sm text-gray-500 mb-1">
                              KTV Orders
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs text-gray-400">Orders</p>
                                <p className="text-lg md:text-xl font-futura">
                                  {item.ktvOrders?.orderCount || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Total</p>
                                <p className="text-lg md:text-xl font-futura text-primary">
                                  {Number(
                                    item.ktvOrders?.total || 0
                                  ).toLocaleString()}{" "}
                                  MMK
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Combined Total - Show when filter is "all" or show filtered total */}
                        <div>
                          <p className="text-xs md:text-sm text-gray-500 mb-1">
                            {paymentMethodFilter === "all"
                              ? "Combined Total"
                              : paymentMethodFilter === "restaurant"
                              ? "Restaurant Total"
                              : "KTV Total"}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-gray-400">Orders</p>
                              <p className="text-lg md:text-xl font-futura font-bold">
                                {paymentMethodFilter === "all"
                                  ? item.combined?.orderCount || 0
                                  : paymentMethodFilter === "restaurant"
                                  ? item.restaurantOrders?.orderCount || 0
                                  : item.ktvOrders?.orderCount || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Total</p>
                              <p className="text-lg md:text-xl font-futura font-bold text-primary">
                                {Number(
                                  paymentMethodFilter === "all"
                                    ? item.combined?.total || 0
                                    : paymentMethodFilter === "restaurant"
                                    ? item.restaurantOrders?.total || 0
                                    : item.ktvOrders?.total || 0
                                ).toLocaleString()}{" "}
                                MMK
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!paymentMethodData && !paymentMethodLoading && (
            <div className="text-center py-10">
              <p className="text-gray-500">
                No payment method report data available. Please select a date
                range and generate a report.
              </p>
            </div>
          )}

          {paymentMethodLoading && (
            <div className="text-center py-10">
              <p className="text-gray-500">Loading payment method report...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SalesReportPage;
