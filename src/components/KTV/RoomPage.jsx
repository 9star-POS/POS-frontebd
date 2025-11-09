import { useNavigate } from "react-router-dom";
import { selectRoom, setRoomDetails } from "./../../redux/ktvReceiptSlice";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import getAllRooms from "../../api/KTV/getAllRooms";
import createRoom from "../../api/KTV/createRoom";
import { toast } from "sonner";
import Loading from "../Loading";
import { Plus, X } from "lucide-react";

const RoomPage = () => {
  const Navigate = useNavigate();
  const dispatch = useDispatch();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    roomNumber: "",
    hourlyRate: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    const res = await getAllRooms();
    if (res?.code === 200 && Array.isArray(res.data)) {
      // console.log("rooms", res.data);
      // const activeRooms = res.data.filter(
      //   (r) => r.status === "active" && !r.isDeleted
      // );
      setRooms(res.data);
    } else {
      setRooms([]);
      toast.error("Failed to load rooms");
    }
    setLoading(false);
  };

  const handleTableSelect = (room) => {
    if (!room) return;
    dispatch(
      setRoomDetails({
        room: room.roomNumber,
        roomId: room._id,
        status: room.status,
      })
    );
    dispatch(selectRoom(room.roomNumber));
    Navigate(`/ktv/${room.roomNumber}`);
  };

  const handleCreateRoom = async () => {
    if (!newRoom.roomNumber.trim()) {
      toast.error("Please enter room number");
      return;
    }
    if (!newRoom.hourlyRate || Number(newRoom.hourlyRate) <= 0) {
      toast.error("Please enter a valid hourly rate");
      return;
    }

    setIsCreating(true);
    const payload = {
      roomNumber: newRoom.roomNumber.trim(),
      hourlyRate: Number(newRoom.hourlyRate),
    };

    const res = await createRoom(payload);
    if (res?.code === 201 && res?.data) {
      toast.success("Room created successfully");
      setNewRoom({ roomNumber: "", hourlyRate: "" });
      setIsCreateModalOpen(false);
      fetchRooms(); // Refresh the list
    } else {
      toast.error(res?.message || "Failed to create room");
    }
    setIsCreating(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex h-screen pt-10 bg-white">
      <div className="w-full px-5">
        <div className="flex justify-between items-center mb-2">
          <h2 className="sub-header">Rooms</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Create Room
          </button>
        </div>

        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <p className="text-gray-500 text-lg">No rooms available</p>
            <button
              onClick={fetchRooms}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="my-5">
            <div className="grid grid-cols-7 gap-4">
              {rooms.map((room) => (
                <button
                  key={room._id}
                  className={`${
                    room.status === "active"
                      ? "bg-primary text-white"
                      : "bg-white text-primary"
                  } border border-gray-300 px-2 py-4 rounded-lg font-bold hover:shadow-lg transition-all`}
                  onClick={() => handleTableSelect(room)}
                >
                  <div className="flex flex-col">
                    <span className="text-lg">Room {room.roomNumber}</span>
                    <span className="text-xs opacity-75">
                      {room.hourlyRate.toLocaleString()} MMK/hr
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-lg font-bold">Create New Room</h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewRoom({ roomNumber: "", hourlyRate: "" });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newRoom.roomNumber}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, roomNumber: e.target.value })
                  }
                  placeholder="Enter room number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate (MMK) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newRoom.hourlyRate}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, hourlyRate: e.target.value })
                  }
                  placeholder="Enter hourly rate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  min="0"
                  disabled={isCreating}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-5">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewRoom({ roomNumber: "", hourlyRate: "" });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={
                    isCreating ||
                    !newRoom.roomNumber.trim() ||
                    !newRoom.hourlyRate
                  }
                  className={`flex-1 px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2 ${
                    isCreating ||
                    !newRoom.roomNumber.trim() ||
                    !newRoom.hourlyRate
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Create
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPage;
