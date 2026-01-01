import React from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { useDispatch } from "react-redux";
import {
  incrementVocalistServiceTime,
  decrementVocalistServiceTime,
  removeVocalistFromRoom,
} from "../../redux/ktvReceiptSlice";

const VocalistsDisplay = ({
  selectedRoom,
  localVocalists,
  remoteVocalists,
}) => {
  const dispatch = useDispatch();

  const vocalists = localVocalists || remoteVocalists || [];

  if (vocalists.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm py-3">
      <p className="font-medium mb-2">Vocalists</p>
      <div className="space-y-2">
        {vocalists.map((v, idx) => (
          <div
            key={v?._id || idx}
            className="flex justify-between items-center"
          >
            <div className="flex-1">
              <p className="text-gray-800">{v?.vocalistName || "Vocalist"}</p>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <span>
                  {Number(v?.hourlyRate || 0).toLocaleString()} MMK/hr ·
                </span>
                <span className="inline-flex items-center gap-1">
                  <button
                    className="p-1 rounded-md hover:bg-gray-100 text-primary"
                    onClick={() =>
                      dispatch(
                        decrementVocalistServiceTime({
                          room: selectedRoom,
                          vocalistId: v?.vocalistId,
                        })
                      )
                    }
                  >
                    <Minus size={14} />
                  </button>
                  <span className="min-w-[40px] text-center">
                    {Number(v?.serviceTime || 0)} hr
                  </span>
                  <button
                    className="p-1 rounded-md hover:bg-gray-100 text-primary"
                    onClick={() =>
                      dispatch(
                        incrementVocalistServiceTime({
                          room: selectedRoom,
                          vocalistId: v?.vocalistId,
                        })
                      )
                    }
                  >
                    <Plus size={14} />
                  </button>
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-medium min-w-[80px] text-right">
                {(
                  Number(v?.hourlyRate || 0) * Number(v?.serviceTime || 0)
                ).toLocaleString()}{" "}
                MMK
              </p>
              <button
                className="p-1 rounded-md hover:bg-red-100 text-red-500"
                onClick={() =>
                  dispatch(
                    removeVocalistFromRoom({
                      room: selectedRoom,
                      vocalistId: v?.vocalistId,
                    })
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VocalistsDisplay;

