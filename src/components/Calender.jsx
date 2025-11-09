import { useEffect, useRef, useState } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css"; // Main CSS file
import "react-date-range/dist/theme/default.css"; // Default theme CSS file
import { format, isSameDay } from "date-fns";
import "tailwindcss/tailwind.css";
import { CalendarIcon } from "lucide-react";

const Calendar = ({
  sendDate,
  selectedStartDate,
  selectedEndDate,
  defaultStartDate,
  defaultEndDate,
}) => {
  const parseDate = (date) => {
    if (!date) return null;
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const getInitialRange = () => {
    const start =
      parseDate(selectedStartDate) || parseDate(defaultStartDate) || new Date();
    const end =
      parseDate(selectedEndDate) ||
      parseDate(selectedStartDate) ||
      parseDate(defaultEndDate) ||
      new Date();

    return [
      {
        startDate: start,
        endDate: end,
        key: "selection",
      },
    ];
  };

  const [state, setState] = useState(getInitialRange);
  const [showCalendar, setShowCalendar] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState(null);
  const buttonRef = useRef(null);
  const committedStart = parseDate(selectedStartDate);
  const committedEnd = parseDate(selectedEndDate) || committedStart;
  const formattedStartDate = committedStart
    ? format(committedStart, "dd/MM/yy")
    : null;
  const formattedEndDate = committedEnd
    ? format(committedEnd, "dd/MM/yy")
    : null;
  const isSingleDate =
    committedStart && committedEnd
      ? isSameDay(committedStart, committedEnd)
      : true;

  const calculatePopoverPosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const gap = 8;
    const estimatedWidth = 360;
    const estimatedHeight = 360;
    const viewportRight = window.scrollX + window.innerWidth;
    const viewportBottom = window.scrollY + window.innerHeight;

    let left = rect.left + window.scrollX;
    let top = rect.bottom + window.scrollY + gap;

    if (left + estimatedWidth > viewportRight) {
      left = Math.max(window.scrollX + 8, viewportRight - estimatedWidth - 8);
    }

    if (top + estimatedHeight > viewportBottom) {
      top = Math.max(
        window.scrollY + 8,
        rect.top + window.scrollY - gap - estimatedHeight
      );
    }

    return { top, left };
  };

  const openCalendar = () => {
    setState(getInitialRange());
    const position = calculatePopoverPosition();
    setPopoverPosition(position);
    setShowCalendar(true);
  };

  const closeCalendar = () => {
    setShowCalendar(false);
    setPopoverPosition(null);
  };

  const handleToggle = () => {
    if (showCalendar) {
      closeCalendar();
    } else {
      openCalendar();
    }
  };

  const handleApply = () => {
    const { startDate, endDate } = state[0];
    sendDate({
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    });
    closeCalendar();
  };

  const handleCancel = () => {
    setState(getInitialRange());
    closeCalendar();
  };

  useEffect(() => {
    if (!showCalendar) return;

    const handleWindowChange = () => {
      const position = calculatePopoverPosition();
      setPopoverPosition(position);
    };

    window.addEventListener("resize", handleWindowChange);
    window.addEventListener("scroll", handleWindowChange, true);

    return () => {
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCalendar]);

  return (
    <div className="text-sm">
      {/* Button to toggle the calendar */}
      <button
        ref={buttonRef}
        className="bg-primary border border-gray-300 flex gap-2 items-center text-white font-semibold px-4 py-2 md:px-8 md:py-2.5 rounded-lg hover:bg-primary/80 transition-colors duration-300"
        onClick={handleToggle}
      >
        <CalendarIcon className="h-4 w-4" />
        {formattedStartDate ? (
          isSingleDate ? (
            <span className="font-bold">{formattedStartDate}</span>
          ) : (
            <>
              <span className="font-bold">{formattedStartDate}</span>
              <span> - </span>
              <span className="font-bold">{formattedEndDate}</span>
            </>
          )
        ) : (
          <span className="font-bold">Select Date</span>
        )}
      </button>

      {/* Conditionally show the calendar */}
      {showCalendar && popoverPosition && (
        <div
          className="fixed z-50 bg-white p-3 space-y-3 rounded-lg shadow-lg"
          style={{
            top: popoverPosition.top,
            left: popoverPosition.left,
            maxWidth: "calc(100vw - 16px)",
          }}
        >
          <DateRange
            editableDateInputs={true}
            onChange={(item) => {
              setState([item.selection]);
            }}
            moveRangeOnFirstSelection={false}
            ranges={state}
            rangeColors={["#EB5B00"]}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/80 transition-colors"
              onClick={handleApply}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
