import { useNavigate } from "react-router-dom";
import { selectRoom } from "./../../redux/ktvReceiptSlice";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import getAllRooms from "../../api/KTV/getAllRooms";
import { toast } from "sonner";
import Loading from "../Loading";

const RoomPage = () => {
  const Navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedRoom = useSelector((state) => state.ktvReceipts.selectedRoom);
  const receipts = useSelector((state) => state.ktvReceipts.receipts);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    const res = await getAllRooms();
    if (res?.code === 200 && Array.isArray(res.data)) {
      const activeRooms = res.data.filter(
        (r) => r.status === "active" && !r.isDeleted
      );
      setRooms(activeRooms);
    } else {
      setRooms([]);
      toast.error("Failed to load rooms");
    }
    setLoading(false);
  };

  const handleTableSelect = (room) => {
    dispatch(selectRoom(room));
    Navigate(`/ktv/${room}`);
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
            <div className="grid grid-cols-3 md:grid-cols-7 gap-4">
              {rooms.map((room) => (
                <button
                  key={room._id}
                  className={`${
                    receipts[room.roomNumber] ||
                    selectedRoom === room.roomNumber
                      ? "bg-primary text-white"
                      : "bg-white text-primary"
                  } border border-gray-300 px-2 py-4 rounded-lg font-bold hover:shadow-lg transition-all`}
                  onClick={() => handleTableSelect(room.roomNumber)}
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
    </div>
  );
};

export default RoomPage;
