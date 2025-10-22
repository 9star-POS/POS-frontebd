// SalesReportPDF.js
// import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    padding: 30,
  },
  section: {
    marginBottom: 10,
  },
  header: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
  },
  text: {
    fontSize: 12,
  },
});

// This component takes salesData as props
const SalesReportPDF = ({ salesData }) => {
  console.log(salesData.dishesSold);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.header}>Sales Report</Text>
          <Text style={styles.title}>
            Total Revenue: ${salesData.totalRevenue}
          </Text>
          <Text style={styles.title}>
            Total Orders: {salesData.ordersCount}
          </Text>
          <Text style={styles.title}>Dishes Sold:</Text>
          <View>
            {salesData.dishesSold.map((dish, index) => (
              <View key={index} style={styles.text}>
                {dish.dishName}: {dish.quantitySold}
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default SalesReportPDF;
