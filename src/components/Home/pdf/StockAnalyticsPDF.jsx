import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import registerPdfFonts from "./registerPdfFonts";

registerPdfFonts();

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "NotoSansMyanmar",
  },
  header: {
    textAlign: "center",
    fontSize: 18,
    marginBottom: 10,
    fontFamily: "NotoSansMyanmar",
    fontWeight: "bold",
  },
  subHeader: {
    textAlign: "center",
    fontSize: 11,
    marginBottom: 16,
    fontFamily: "NotoSansMyanmar",
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 6,
    fontFamily: "NotoSansMyanmar",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: "#333333",
    fontFamily: "NotoSansMyanmar",
  },
  value: {
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: "NotoSansMyanmar",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    paddingBottom: 4,
    marginBottom: 4,
  },
  headerText: {
    fontFamily: "NotoSansMyanmar",
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eeeeee",
  },
  cell: {
    paddingRight: 6,
  },
  flex2: {
    width: "32%",
  },
  flex1: {
    width: "17%",
  },
  cellText: {
    fontFamily: "NotoSansMyanmar",
  },
});

const formatDate = (date) => {
  if (!date) return "";
  try {
    return format(new Date(date), "PPP");
  } catch {
    return String(date);
  }
};

const formatCurrency = (value) =>
  typeof value === "number" ? `${value.toLocaleString("en-US")} MMK` : "0 MMK";

const StockAnalyticsPDF = ({ analyticsData, startDate, endDate }) => {
  const summary = analyticsData?.summary;
  const items = Array.isArray(analyticsData?.analytics)
    ? analyticsData.analytics
    : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Stock Analytics</Text>
        <Text style={styles.subHeader}>
          {formatDate(startDate)} - {formatDate(endDate)}
        </Text>

        {summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.label, styles.cellText]}>Unique Items</Text>
              <Text style={[styles.value, styles.cellText]}>
                {summary.totalUniqueStocks || 0}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.label, styles.cellText]}>
                Total Quantity Sold
              </Text>
              <Text style={[styles.value, styles.cellText]}>
                {summary.totalItemsSold || 0}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.label, styles.cellText]}>Total Revenue</Text>
              <Text style={[styles.value, styles.cellText]}>
                {formatCurrency(summary.totalRevenue || 0)}
              </Text>
            </View>
          </View>
        )}

        {items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Item Breakdown</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.cell, styles.flex2, styles.headerText]}>
                Item
              </Text>
              <Text style={[styles.cell, styles.flex1, styles.headerText]}>
                Quantity
              </Text>
              <Text style={[styles.cell, styles.flex1, styles.headerText]}>
                Revenue
              </Text>
              <Text style={[styles.cell, styles.flex1, styles.headerText]}>
                Restaurant
              </Text>
              <Text style={[styles.cell, styles.flex1, styles.headerText]}>
                KTV
              </Text>
              <Text style={[styles.cell, styles.flex1, styles.headerText]}>
                Orders
              </Text>
            </View>
            {items.map((item) => (
              <View key={item.stockId} style={styles.tableRow}>
                <Text style={[styles.cell, styles.flex2, styles.cellText]}>
                  {item.stockName || "-"}
                </Text>
                <Text style={[styles.cell, styles.flex1, styles.cellText]}>
                  {item.totalQuantity ?? 0}
                </Text>
                <Text style={[styles.cell, styles.flex1, styles.cellText]}>
                  {formatCurrency(item.totalRevenue ?? 0)}
                </Text>
                <Text style={[styles.cell, styles.flex1, styles.cellText]}>
                  {item.restaurantQuantity ?? 0}
                </Text>
                <Text style={[styles.cell, styles.flex1, styles.cellText]}>
                  {item.ktvQuantity ?? 0}
                </Text>
                <Text style={[styles.cell, styles.flex1, styles.cellText]}>
                  {item.orderCount ?? 0}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default StockAnalyticsPDF;
