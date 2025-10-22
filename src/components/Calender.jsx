import { useState } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css"; // Main CSS file
import "react-date-range/dist/theme/default.css"; // Default theme CSS file
import { format, isSameDay } from "date-fns";
import "tailwindcss/tailwind.css";
import { CalendarIcon } from "lucide-react";

const Calendar = ({ sendDate }) => {
  const [state, setState] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const [showCalendar, setShowCalendar] = useState(false);
  const { startDate, endDate } = state[0];
  const formattedStartDate = format(startDate, "dd/MM/yy");
  const formattedEndDate = format(endDate, "dd/MM/yy");
  const isSingleDate = isSameDay(startDate, endDate);

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
    handleSendDate();
  };

  const handleSendDate = () => {
    // Send data to the parent using the callback function
    sendDate({
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    });
  };

  return (
    <div className="text-sm">
      {/* Button to toggle the calendar */}
      <button
        className="bg-white border border-gray-300 flex gap-2 items-center text-primary font-semibold px-4 py-2 md:px-8 md:py-4 rounded-sm hover:bg-primary hover:text-white hover:border-primary transition-colors duration-300"
        onClick={toggleCalendar}
      >
        <CalendarIcon className="h-4 w-4" />
        {isSingleDate ? (
          <span className="font-bold">{formattedStartDate}</span>
        ) : (
          <>
            <span className="font-bold">{formattedStartDate}</span>
            <span> - </span>
            <span className="font-bold">{formattedEndDate}</span>
          </>
        )}
      </button>

      {/* Conditionally show the calendar */}
      {showCalendar && (
        <DateRange
          editableDateInputs={true}
          onChange={(item) => setState([item.selection])}
          moveRangeOnFirstSelection={false}
          ranges={state}
          className="mt-4 rounded-lg absolute right-7 md:right-10"
        />
      )}
    </div>
  );
};

export default Calendar;
