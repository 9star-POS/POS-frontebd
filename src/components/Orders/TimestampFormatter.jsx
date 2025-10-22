const TimestampFormatter = ({ timestamp }) => {
  // Create a new Date object from the timestamp
  const date = new Date(timestamp);

  // Format the date to 12-hour format with AM/PM
  const options = { hour: "numeric", minute: "numeric", hour12: true };
  const formattedTime = new Intl.DateTimeFormat("en-US", options).format(date);

  return <span>{formattedTime}</span>;
};

export default TimestampFormatter;
