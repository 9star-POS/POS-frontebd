import { useDispatch, useSelector } from "react-redux";
import {
  addItemToRoomReceipt,
  incrementRoomItemQuantity,
  decrementRoomItemQuantity,
} from "../../redux/ktvReceiptSlice";
import { toast } from "sonner";
import PropTypes from "prop-types";
import { CirclePlus, CircleMinus } from "lucide-react";
import defaultImage from "./../../assets/defaultMenu.jpg";

const KtvMenuCard = ({ menu }) => {
  const dispatch = useDispatch();
  const selectedRoom = useSelector((state) => state.ktvReceipts.selectedRoom);
  const receipts = useSelector((state) => state.ktvReceipts.receipts);

  const currentItem =
    selectedRoom &&
    receipts[selectedRoom]?.items.find((item) => item.name === menu.name);
  const quantity = currentItem?.quantity || 0;

  const handleIncrement = () => {
    if (selectedRoom !== null) {
      if (quantity === 0) {
        dispatch(addItemToRoomReceipt({ room: selectedRoom, item: menu }));
      } else {
        dispatch(
          incrementRoomItemQuantity({ room: selectedRoom, itemName: menu.name })
        );
      }
    } else {
      toast.warning("Please Select Room");
    }
  };

  const handleDecrement = () => {
    if (selectedRoom !== null) {
      dispatch(
        decrementRoomItemQuantity({ room: selectedRoom, itemName: menu.name })
      );
    }
  };

  return (
    <div className="w-auto lg:w-[200px] overflow-hidden border border-gray-200 rounded-lg shadow-md">
      <div className="hidden lg:block">
        <img
          className="w-full h-48 sm:h-32 object-cover"
          src={menu.stockImagesUrl?.[0]?.url || defaultImage}
          alt="Food"
        />
      </div>

      <div className="flex h-[80px] gap-2 justify-between items-center mt-2 mx-1 ">
        <div className="font-raleway overflow-hidden ">
          <h2 className="font-semibold multi-line-truncate text-gray-800">
            {menu.name}{" "}
          </h2>
          <p className="text-gray-500 truncate text-sm mt-1">
            {menu.price} MMK
          </p>
        </div>
        <div className="flex gap-1 items-center">
          <button
            className="bg-secondary text-primary px-2 py-3 active:scale-105 active:bg-primary active:text-white rounded-lg"
            onClick={handleDecrement}
          >
            <CircleMinus size={17} />
          </button>
          <span className="font-semibold min-w-[20px] text-center">
            {quantity}
          </span>
          <button
            className="bg-secondary text-primary px-2 py-3 active:scale-105 active:bg-primary active:text-white rounded-lg"
            onClick={handleIncrement}
          >
            <CirclePlus size={17} />
          </button>
        </div>
      </div>
    </div>
  );
};

KtvMenuCard.propTypes = {
  menu: PropTypes.shape({
    dishImage: PropTypes.string,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
  }).isRequired,
};

export default KtvMenuCard;
