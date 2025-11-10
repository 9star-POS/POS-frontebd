import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import Calendar from "../components/Calender";
import getSaleReport from "../api/report/getSaleReport";
import getStockAnalytics from "../api/report/getStockAnalytics";
import { ArrowUpDown } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SalesSummaryPDF from "../components/Home/pdf/SalesSummaryPDF";
import StockAnalyticsPDF from "../components/Home/pdf/StockAnalyticsPDF";

const SalesReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activeTab, setActiveTab] = useState("sales"); // "sales" or "analytics"
  const [analyticsFilter, setAnalyticsFilter] = useState("all"); // all, restaurant, ktv
  const [sortConfig, setSortConfig] = useState({
    key: "totalQuantity",
    direction: "descending",
  });
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const handleDateChange = (dates) => {
    setStartDate(dates.startDate);
    setEndDate(dates.endDate);
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
      console.log("Sales Report Response:", response);
      if (response.status === "success") {
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
      if (response.status === "success") {
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

  const generateReport = () => {
    if (activeTab === "sales") {
      fetchReport();
    } else {
      fetchAnalytics();
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
      <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-2">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-[36px] font-futura">{orderCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-[36px] font-futura text-primary">
              {(totalAmount / 1000).toFixed(2)}K KS
            </p>
          </div>
        </div>
      </div>
    );
  };

  const AnalyticsSummaryCard = ({ data }) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-2">
          <h3 className="text-lg font-semibold mb-2">Unique Items</h3>
          <p className="text-[36px] font-futura">
            {data?.totalUniqueStocks || 0}
          </p>
          <p className="text-sm text-gray-500">Different items sold</p>
        </div>
        <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-2">
          <h3 className="text-lg font-semibold mb-2">Total Quantity</h3>
          <p className="text-[36px] font-futura">{data?.totalItemsSold || 0}</p>
          <p className="text-sm text-gray-500">Items sold</p>
        </div>
        <div className="border-l-4 border-primary bg-white rounded-lg shadow-md p-2">
          <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
          <p className="text-[36px] font-futura text-primary">
            {(data?.totalRevenue / 1000).toFixed(2) || "0.00"}K KS
          </p>
          <p className="text-sm text-gray-500">Revenue generated</p>
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
    <div className="p-4 h-[calc(100vh-110px)]">
      <div className="flex justify-between items-center mb-5">
        <h1 className="sub-header font-bold">Reports</h1>
        <div className="flex items-center gap-4 flex-wrap justify-end">
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
              className="bg-white border border-primary text-primary px-4 py-2 rounded-lg font-semibold hover:bg-prilight transition-colors"
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
              className="bg-white border border-primary text-primary px-4 py-2 rounded-lg font-semibold hover:bg-prilight transition-colors"
            >
              {({ loading: pdfLoading }) =>
                pdfLoading ? "Preparing PDF..." : "Download Analytics PDF"
              }
            </PDFDownloadLink>
          )}
          <button
            onClick={generateReport}
            className="bg-primary text-white px-8 py-2 rounded-lg hover:opacity-90 transition-colors font-semibold"
            disabled={activeTab === "sales" ? loading : analyticsLoading}
          >
            {(activeTab === "sales" ? loading : analyticsLoading)
              ? "Loading..."
              : "Generate Report"}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-5">
        <button
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "sales"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("sales")}
        >
          Sales Report
        </button>
        <button
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "analytics"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("analytics")}
        >
          Stock Analytics
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              <div className="flex gap-3 mb-4">
                {[
                  { key: "all", label: "All" },
                  { key: "restaurant", label: "Restaurant" },
                  { key: "ktv", label: "KTV" },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setAnalyticsFilter(option.key)}
                    className={`px-4 py-2 rounded-lg border font-semibold transition-all ${
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

              <div className="bg-white rounded-lg shadow-md pb-10 overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-47  0px)]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Item Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => requestSort("totalQuantity")}
                        >
                          <div className="flex items-center">
                            Quantity
                            <ArrowUpDown size={14} className="ml-1" />
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => requestSort("totalRevenue")}
                        >
                          <div className="flex items-center">
                            Revenue
                            <ArrowUpDown size={14} className="ml-1" />
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Restaurant
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          KTV
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.stockName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.totalQuantity}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-primary">
                              {(item.totalRevenue / 1000).toFixed(2)}K KS
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.restaurantQuantity}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.ktvQuantity}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.orderCount}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
    </div>
  );
};

export default SalesReportPage;
