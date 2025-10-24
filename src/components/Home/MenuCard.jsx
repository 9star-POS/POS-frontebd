import { useDispatch, useSelector } from "react-redux";
import {
  addItemToReceipt,
  incrementQuantity,
  decrementQuantity,
} from "./../../redux/receiptSlice";
import { toast } from "sonner";
import PropTypes from "prop-types";
import { CirclePlus, CircleMinus } from "lucide-react";
import defaultImage from "./../../assets/defaultMenu.jpg";

const MenuCard = ({ menu }) => {
  const dispatch = useDispatch();
  const selectedTable = useSelector((state) => state.receipts.selectedTable);
  const receipts = useSelector((state) => state.receipts.receipts);

  const currentItem =
    selectedTable &&
    receipts[selectedTable]?.items.find((item) => item.name === menu.name);
  const quantity = currentItem?.quantity || 0;

  const handleIncrement = () => {
    if (selectedTable !== null) {
      if (quantity === 0) {
        dispatch(addItemToReceipt({ table: selectedTable, item: menu }));
      } else {
        dispatch(
          incrementQuantity({ table: selectedTable, itemName: menu.name })
        );
      }
    } else {
      toast.warning("Please Select Table");
    }
  };

  const handleDecrement = () => {
    if (selectedTable !== null) {
      dispatch(
        decrementQuantity({ table: selectedTable, itemName: menu.name })
      );
    }
  };

  return (
    <div className="w-auto lg:w-[200px] overflow-hidden border border-gray-200 rounded-lg shadow-md">
      <div className="hidden lg:block">
        <img
          className="w-full h-48 sm:h-32 object-cover"
          src={menu.stockImagesUrl[0].url || defaultImage}
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

MenuCard.propTypes = {
  menu: PropTypes.shape({
    dishImage: PropTypes.string,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
  }).isRequired,
};

export default MenuCard;
