import React from "react";
import { X } from "lucide-react";

const ChangeRoomModal = ({
  isOpen,
  onClose,
  availableRooms,
  isLoadingRooms,
  isChangingRoom,
  onChangeRoom,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-lg font-bold">Change Room</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isChangingRoom}
          >
            <X size={20} />
          </button>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoadingRooms ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading rooms...</p>
            </div>
          ) : availableRooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No available rooms
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                Select a room to move this order to:
              </p>
              {availableRooms.map((room) => (
                <button
                  key={room._id}
                  onClick={() => onChangeRoom(room._id, room.roomNumber)}
                  disabled={isChangingRoom}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    isChangingRoom
                      ? "bg-gray-100 border-gray-200 cursor-not-allowed"
                      : "bg-white border-gray-200 hover:border-primary hover:bg-primary/5 cursor-pointer"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">
                        Room {room.roomNumber}
                      </p>
                      {room.status && (
                        <p className="text-sm text-gray-500 capitalize">
                          Status: {room.status}
                        </p>
                      )}
                    </div>
                    {room.hourlyRate && (
                      <p className="text-sm text-gray-600">
                        {room.hourlyRate.toLocaleString()} MMK/hr
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              disabled={isChangingRoom}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeRoomModal;

