import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, UserPlus } from "lucide-react";
import getAllVocalists from "../../api/KTV/getAllVocalists";
import {
  addVocalistToRoom,
  setVocalistsForRoom,
} from "../../redux/ktvReceiptSlice";
import { toast } from "sonner";
import Loading from "../Loading";
import addVocalistToOrder from "../../api/KTV/addVocalistToOrder";

const VocalistModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const selectedRoom = useSelector((state) => state.ktvReceipts.selectedRoom);
  const orderId = useSelector(
    (state) => state.ktvReceipts.orderIds?.[selectedRoom] || null
  );
  console.log(orderId);
  const existingVocalists = useSelector(
    (state) => state.ktvReceipts.receipts[selectedRoom]?.vocalists || []
  );
  const [vocalists, setVocalists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVocalists, setSelectedVocalists] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchVocalists();
    }
  }, [isOpen]);

  const fetchVocalists = async () => {
    setLoading(true);
    const res = await getAllVocalists();
    if (res?.code === 200 && Array.isArray(res.data)) {
      const activeVocalists = res.data.filter(
        (v) => v.status === "active" && !v.isDeleted
      );
      setVocalists(activeVocalists);
    } else {
      setVocalists([]);
      toast.error("Failed to load vocalists");
    }
    setLoading(false);
  };

  const isVocalistAlreadyAdded = (vocalistId) => {
    return existingVocalists.some((v) => v.vocalistId === vocalistId);
  };

  const toggleVocalist = (vocalist) => {
    const isSelected = selectedVocalists.find((v) => v._id === vocalist._id);
    if (isSelected) {
      setSelectedVocalists(
        selectedVocalists.filter((v) => v._id !== vocalist._id)
      );
    } else {
      setSelectedVocalists([...selectedVocalists, vocalist]);
    }
  };

  const handleAddVocalists = async () => {
    if (!selectedRoom) {
      toast.warning("Please select a room first");
      return;
    }
    if (selectedVocalists.length === 0) {
      toast.warning("Please select at least one vocalist");
      return;
    }

    // If orderId exists, use the API to add vocalists to the order
    if (orderId) {
      setLoading(true);
      const payload = selectedVocalists.map((v) => ({
        vocalistId: v._id,
      }));

      const res = await addVocalistToOrder({
        orderId,
        vocalists: payload,
      });

      if (res?.status === "success" || res?.code === 200 || res?.code === 201) {
        toast.success(`${selectedVocalists.length} vocalist(s) added to order`);

        // Update Redux state with response data
        if (Array.isArray(res?.data?.vocalist)) {
          dispatch(
            setVocalistsForRoom({
              room: selectedRoom,
              vocalists: res.data.vocalist,
            })
          );
        } else {
          // Fallback: manually add to local state
          selectedVocalists.forEach((v) => {
            dispatch(
              addVocalistToRoom({
                room: selectedRoom,
                vocalist: {
                  vocalistId: v._id,
                  vocalistName: v.vocalistName,
                  hourlyRate: v.hourlyRate,
                  serviceTime: 0,
                },
              })
            );
          });
        }
      } else {
        toast.error("Failed to add vocalists to order");
      }
      setLoading(false);
    } else {
      // No order yet, just add to local state
      selectedVocalists.forEach((v) => {
        dispatch(
          addVocalistToRoom({
            room: selectedRoom,
            vocalist: {
              vocalistId: v._id,
              vocalistName: v.vocalistName,
              hourlyRate: v.hourlyRate,
              serviceTime: 0,
            },
          })
        );
      });
      toast.success(`${selectedVocalists.length} vocalist(s) added`);
    }

    setSelectedVocalists([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-xl font-bold">Add Vocalist</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loading />
            </div>
          ) : vocalists.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No vocalists available
            </div>
          ) : (
            <div className="space-y-3">
              {vocalists.map((vocalist) => {
                const alreadyAdded = isVocalistAlreadyAdded(vocalist._id);
                const isSelected = selectedVocalists.find(
                  (v) => v._id === vocalist._id
                );
                return (
                  <div
                    key={vocalist._id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      alreadyAdded
                        ? "bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed"
                        : isSelected
                        ? "bg-primary/10 border-primary"
                        : "border-gray-300 hover:border-primary"
                    }`}
                    onClick={() => !alreadyAdded && toggleVocalist(vocalist)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {vocalist.vocalistName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {vocalist.hourlyRate.toLocaleString()} MMK/hr
                        </p>
                      </div>
                      {alreadyAdded ? (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          Already Added
                        </span>
                      ) : isSelected ? (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-5">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddVocalists}
              disabled={selectedVocalists.length === 0}
              className={`flex-1 px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2 ${
                selectedVocalists.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90"
              }`}
            >
              <UserPlus size={18} />
              Add{" "}
              {selectedVocalists.length > 0 && `(${selectedVocalists.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocalistModal;
