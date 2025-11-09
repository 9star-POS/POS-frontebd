import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import registerPdfFonts from "./registerPdfFonts";

registerPdfFonts();

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 12,
    fontFamily: "NotoSansMyanmar",
  },
  header: {
    textAlign: "center",
    fontSize: 18,
    marginBottom: 16,
  },
  subHeader: {
    fontSize: 12,
    marginBottom: 12,
    textAlign: "center",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    fontFamily: "NotoSansMyanmar",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: "#333333",
    fontFamily: "NotoSansMyanmar",
  },
  value: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "NotoSansMyanmar",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    marginVertical: 8,
  },
});

const formatCurrency = (value) =>
  typeof value === "number"
    ? `${value.toLocaleString("en-US")} MMK`
    : "0 MMK";

const formatDate = (date) => {
  if (!date) return "";
  try {
    return format(new Date(date), "PPP");
  } catch {
    return String(date);
  }
};

const renderSection = (title, data) => {
  if (!data) return null;
  const orderCount =
    data.totalOrderCount ??
    data.orderCount ??
    data.totalOrders ??
    data.orders ??
    0;
  const totalAmount =
    data.totalTotal ?? data.total ?? data.totalRevenue ?? data.amount ?? 0;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Total Orders</Text>
        <Text style={styles.value}>{orderCount}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Total Amount</Text>
        <Text style={styles.value}>{formatCurrency(totalAmount)}</Text>
      </View>
    </View>
  );
};

const SalesSummaryPDF = ({ reportData, startDate, endDate }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Sales Report Summary</Text>
        <Text style={styles.subHeader}>
          {formatDate(startDate)} - {formatDate(endDate)}
        </Text>

        <View style={styles.divider} />

        {renderSection("Restaurant Orders", reportData?.restaurantOrders)}
        {renderSection("KTV Orders", reportData?.ktvOrders)}
        {renderSection("Combined Total", reportData?.combined)}
      </Page>
    </Document>
  );
};

export default SalesSummaryPDF;

