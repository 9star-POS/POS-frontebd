import TimestampFormatter from "./TimestampFormatter";

function ReportTable({ orders }) {
  return (
    <div className="shadow-lg h-[75vh] overflow-y-auto border border-gray-200">
      <table className="min-w-full divide-y bg-primary divide-gray-200 py-10 ">
        <thead className="bg-primary">
          <tr>
            <th className="px-6 py-3 text-left text-md font-semibold text-white tracking-wider">
              No
            </th>
            <th className="px-6 py-3 text-left text-md font-semibold text-white tracking-wider">
              Dish
            </th>
            <th className="px-6 py-3 text-left text-md font-semibold text-white tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-left text-md font-semibold text-white tracking-wider">
              Total Sale
            </th>
            <th className="px-6 py-3 text-left text-md font-semibold text-white tracking-wider">
              Total Price + Tax
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
              {/* <td className="px-6 py-4 whitespace-nowrap">{order.table}</td> */}

              <td className="px-6 py-4 whitespace-nowrap">{order.dishName}</td>

              <td className="px-6 py-4 whitespace-nowrap">
                {order.originalPrice}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {order.quantitySold}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {order.totalSoldPriceWithTax}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReportTable;
