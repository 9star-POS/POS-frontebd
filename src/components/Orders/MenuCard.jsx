import { CirclePlus } from "lucide-react";
import PropTypes from "prop-types";
import { useState } from "react";

const MenuCard = ({ menu, sentItem }) => {
  const [num, setNum] = useState(0);
  const handleMenuSelect = (item) => {
    const receiptItem = {
      dishName: item.dishName,
      price: item.price,
      quantity: 1,
    };
    sentItem(receiptItem);
  };
  return (
    <div className="w-full sm:w-[200px] overflow-hidden">
      <div>
        <img
          className="w-full h-48 sm:h-32 object-cover"
          src={menu.dishImage}
          alt="Food"
        />
      </div>

      <div className="flex h-[80px] gap-5 justify-between items-center mt-2 mx-2 ">
        <div className="font-raleway ">
          <h2 className="font-semibold text-gray-800 multi-line-truncate">
            {menu.dishName}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{menu.price} MMK</p>
        </div>
        <button
          className="bg-secondary text-primary px-2 py-3 active:scale-105 relative"
          onClick={() => {
            handleMenuSelect(menu);
            setNum(num + 1);
          }}
        >
          <CirclePlus size={17} />
          <p className="md:hidden absolute top-[-10px] right-[-8px] bg-primary text-white text-[10px] px-2 py-1 rounded-full">
            {num}
          </p>
        </button>
      </div>
    </div>
  );
};

MenuCard.propTypes = {
  menu: PropTypes.shape({
    dishImage: PropTypes.string.isRequired,
    dishName: PropTypes.string.isRequired,
  }).isRequired,
};

export default MenuCard;
