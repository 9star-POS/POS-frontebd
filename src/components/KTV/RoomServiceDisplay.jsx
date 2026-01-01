import React from "react";
import { Plus, Minus } from "lucide-react";
import { useDispatch } from "react-redux";
import {
  incrementRoomServiceTime,
  decrementRoomServiceTime,
} from "../../redux/ktvReceiptSlice";

const RoomServiceDisplay = ({
  selectedRoom,
  localRoomService,
  remoteRoomService,
}) => {
  const dispatch = useDispatch();

  if (!localRoomService && !remoteRoomService) return null;

  const hourlyRate =
    localRoomService?.hourlyRate ?? remoteRoomService?.hourlyRate ?? 0;
  const serviceTime =
    localRoomService?.serviceTime ?? remoteRoomService?.serviceTime ?? 0;

  return (
    <div className="flex justify-between items-center bg-white py-3 rounded-lg shadow-sm">
      <div className="flex-1">
        <p className="font-medium">Room Service</p>
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <span>{Number(hourlyRate).toLocaleString()} MMK/hr ·</span>
          <span className="inline-flex items-center gap-1">
            <button
              className="p-1 rounded-md hover:bg-gray-100 text-primary"
              onClick={() =>
                dispatch(decrementRoomServiceTime({ room: selectedRoom }))
              }
            >
              <Minus size={14} />
            </button>
            <span className="min-w-[40px] text-center">{Number(serviceTime)} hr</span>
            <button
              className="p-1 rounded-md hover:bg-gray-100 text-primary"
              onClick={() =>
                dispatch(incrementRoomServiceTime({ room: selectedRoom }))
              }
            >
              <Plus size={14} />
            </button>
          </span>
        </p>
      </div>
      <p className="font-medium min-w-[100px] text-right">
        {(Number(hourlyRate) * Number(serviceTime)).toLocaleString()} MMK
      </p>
    </div>
  );
};

export default RoomServiceDisplay;

