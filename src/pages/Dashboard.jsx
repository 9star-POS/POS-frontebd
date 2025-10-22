import { useEffect, useState } from "react";
import { format } from "date-fns";

import ReportTable from "../components/Orders/ReportTable";
import Calendar from "../components/Calender";
import getReport from "../api/report/getReport";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SalesReportPDF from "../components/Home/pdf/SalesReportPDF";

function Dashboard() {
  const date = new Date();
  const [salesData, setSaleData] = useState({});
  const formattedDate = format(date, "yyyy-MM-dd");
  const [orderCount, setOrderCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [dishes, setDishes] = useState([]);
  const [dataFromCalendar, setDataFromCalendar] = useState({
    startDate: formattedDate,
    endDate: formattedDate,
  });

  const handleDataFromCalendar = (childData) => {
    setDataFromCalendar(childData);
  };

  const getReportData = async () => {
    const res = await getReport(dataFromCalendar);
    console.log(res);
    setSaleData(res.data);
    setOrderCount(res.data.ordersCount);
    setTotalRevenue(res.data.totalRevenue);
    setDishes(res.data.dishesSold);
  };

  useEffect(() => {
    getReportData();
  }, [dataFromCalendar]);
  return (
    <div>
      <div className="p-4">
        <div className="flex justify-between items-center">
          <h1 className="sub-header font-bold">Sale Report </h1>
          <Calendar sendDate={handleDataFromCalendar} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-md p-2">
            <h2 className="text-lg font-semibold mb-2">Total Orders</h2>
            <p className="text-[36px] font-futura">{orderCount}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-2">
            <h2 className="text-lg font-semibold mb-2">Total Revenue</h2>
            <p className="text-[36px] font-futura">{totalRevenue} MMK</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center">
            <h2 className="sub-header font-bold mb-6">Sale Table</h2>
            {salesData.ordersCount > 0 ? (
              <PDFDownloadLink
                document={
                  <SalesReportPDF
                    data={salesData}
                    startDate={dataFromCalendar.startDate}
                    endDate={dataFromCalendar.endDate}
                  />
                }
                fileName="sales-report.pdf"
              >
                {({ blob, url, loading, error }) =>
                  loading ? "Loading document..." : "Download"
                }
              </PDFDownloadLink>
            ) : (
              <p>No data available</p>
            )}
            {/* <button
              className="bg-primary text-white flex items-center gap-3 font-semibold px-4 py-2 rounded-lg"
              // onClick={handleDownload}
            >
              <TbReport size={20} /> Print
            </button> */}
          </div>
          <div className="bg-white rounded-lg shadow-md pb-10">
            <ReportTable orders={dishes} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
