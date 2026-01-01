import React from "react";
import TimestampFormatter from "../Orders/TimestampFormatter";

const RoomHeader = ({
  selectedRoom,
  remoteOrder,
  localCreationTime,
  orderType,
  orderId,
  onChangeRoom,
}) => {
  return (
    <div className="flex justify-between items-center mb-3 bg-gray-50 p-3 rounded-lg">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-gray-800 font-medium">Room {selectedRoom}</p>
          {(remoteOrder?.createdAt || localCreationTime) && (
            <p className="text-gray-500 text-sm">
              Started:{" "}
              <TimestampFormatter
                timestamp={remoteOrder?.createdAt || localCreationTime}
              />
            </p>
          )}
        </div>
        {orderId && (
          <button
            onClick={onChangeRoom}
            className="text-primary hover:text-primary/80 text-xs font-semibold px-3 py-1 border border-primary rounded-md hover:bg-primary/10 transition-colors"
            title="Change Room"
          >
            Change Room
          </button>
        )}
      </div>
      <div className="text-right">
        <p className="text-gray-500 text-sm">{orderType || "KTV"}</p>
        {(remoteOrder?.createdAt || localCreationTime) && (
          <p className="text-gray-500 text-sm">
            {new Date(
              remoteOrder?.createdAt || localCreationTime
            ).toLocaleDateString("en-GB")}
          </p>
        )}
      </div>
    </div>
  );
};

export default RoomHeader;

