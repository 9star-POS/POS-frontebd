import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import Calendar from "../components/Calender";
import getSaleReport from "../api/report/getSaleReport";
import getStockAnalytics from "../api/report/getStockAnalytics";
import { ArrowUpDown } from "lucide-react";

const SalesReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activeTab, setActiveTab] = useState("sales"); // "sales" or "analytics"
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

  const ReportCard = ({ title, data, color }) => {
    // Handle both combined and individual order data structures
    const orderCount =
      data.totalOrderCount !== undefined
        ? data.totalOrderCount
        : data.orderCount || 0;
    const totalAmount =
      data.totalTotal !== undefined ? data.totalTotal : data.total || 0;

    return (
      <div className={`border-l-4 ${color} bg-white p-4 rounded-lg shadow-md`}>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-xl font-bold">{orderCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-xl font-bold">
              {(totalAmount / 1000).toFixed(2)}K KS
            </p>
          </div>
        </div>
      </div>
    );
  };

  const AnalyticsSummaryCard = ({ data }) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="border-l-4 border-blue-500 bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Unique Items</h3>
          <p className="text-xl font-bold">{data?.totalUniqueStocks || 0}</p>
          <p className="text-sm text-gray-500">Different items sold</p>
        </div>
        <div className="border-l-4 border-purple-500 bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Quantity</h3>
          <p className="text-xl font-bold">{data?.totalItemsSold || 0}</p>
          <p className="text-sm text-gray-500">Items sold</p>
        </div>
        <div className="border-l-4 border-green-500 bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
          <p className="text-xl font-bold">
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
    <div className="container mx-auto p-4 overflow-y-auto h-[calc(100vh-100px)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex items-center gap-4">
          <Calendar sendDate={handleDateChange} />
          <button
            onClick={generateReport}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            disabled={activeTab === "sales" ? loading : analyticsLoading}
          >
            {(activeTab === "sales" ? loading : analyticsLoading)
              ? "Loading..."
              : "Generate Report"}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "sales"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("sales")}
        >
          Sales Report
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "analytics"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("analytics")}
        >
          Stock Analytics
        </button>
      </div>

      {/* Date Range Display */}
      {(activeTab === "sales" ? reportData : analyticsData) && (
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
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
      )}

      {/* Sales Report Tab Content */}
      {activeTab === "sales" && (
        <>
          {reportData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <ReportCard
                title="Restaurant Orders"
                data={reportData.restaurantOrders}
                color="border-blue-500"
              />
              <ReportCard
                title="KTV Orders"
                data={reportData.ktvOrders}
                color="border-purple-500"
              />
              <ReportCard
                title="Combined Total"
                data={reportData.combined}
                color="border-green-500"
              />
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
              <AnalyticsSummaryCard data={analyticsData.summary} />

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
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
                      {sortData(analyticsData.analytics).map((item) => (
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
                            <div className="text-sm text-gray-900">
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
