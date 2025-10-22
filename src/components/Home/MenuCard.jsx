import { useDispatch, useSelector } from "react-redux";
import { addItemToReceipt } from "./../../redux/receiptSlice";
import { toast } from "sonner";
import PropTypes from "prop-types";
import { CirclePlus } from "lucide-react";
import defaultImage from "./../../assets/defaultMenu.jpg";

const MenuCard = ({ menu }) => {
  const dispatch = useDispatch();
  const selectedTable = useSelector((state) => state.receipts.selectedTable);
  const receipts = useSelector((state) => state.receipts.receipts);
  console.log(receipts[selectedTable]);
  const handleMenuSelect = (item) => {
    if (selectedTable !== null) {
      dispatch(addItemToReceipt({ table: selectedTable, item }));
    } else {
      toast.warning("Please Select Table");
    }
  };
  return (
    <div className="sm:w-[200px] overflow-hidden border border-gray-200 rounded-lg shadow-md">
      <div className="hidden md:block">
        <img
          className="w-full h-48 sm:h-32 object-cover"
          src={menu.dishImage || defaultImage}
          alt="Food"
        />
      </div>

      <div className="flex h-[80px] gap-5 justify-between items-center mt-2 mx-2 ">
        <div className="font-raleway ">
          <h2 className="font-semibold text-gray-800 multi-line-truncate">
            {menu.dishName}{" "}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{menu.price} MMK</p>
        </div>
        <button
          className="bg-secondary text-primary px-2 py-3 active:scale-105 active:bg-primary active:text-white rounded-lg"
          onClick={() => handleMenuSelect(menu)}
        >
          <CirclePlus size={17} />
        </button>
      </div>
    </div>
  );
};

MenuCard.propTypes = {
  menu: PropTypes.shape({
    dishImage: PropTypes.string.isRequired,
    dishName: PropTypes.string.isRequired,
    // price: PropTypes.string.isRequired,
  }).isRequired,
};

export default MenuCard;
