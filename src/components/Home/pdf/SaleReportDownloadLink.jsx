// SalesReportDownloadLink.js
// import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SalesReportPDF from "./SalesReportPDF"; // Adjust the path as necessary

const SalesReportDownloadLink = ({ salesData }) => (
  <PDFDownloadLink
    document={<SalesReportPDF salesData={salesData} />}
    fileName="POS_Sale_Report.pdf"
  >
    {({ loading }) => (loading ? "Loading document..." : "Download PDF")}
  </PDFDownloadLink>
);

export default SalesReportDownloadLink;
