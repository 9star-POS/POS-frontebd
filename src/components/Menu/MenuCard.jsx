import PropTypes from "prop-types";
import EditMenuModel from "./EditMenuModel";
import { useEffect, useState } from "react";
import { Edit3Icon, Trash2Icon } from "lucide-react";
import Deleteitems from "../../api/Menu/deleteItem";
import DeleteModel from "../DeleteModel";
import defaultImage from "../../assets/defaultMenu.jpg";

const MenuCard = ({ menu, refreshMenu }) => {
  // console.log("card", menu);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleAction = () => {
    refreshMenu();
  };

  const deleteItems = async (id) => {
    const res = await Deleteitems(id);
    if (res.status === "success") {
      handleAction();
    }
  };

  useEffect(() => {
    handleAction();
  }, [isModalOpen]);
  // console.log(menu);
  return (
    <div className="sm:w-[200px] bg-white shadow-lg overflow-hidden relative">
      <div className="hidden md:block">
        <img
          className="w-full h-48 sm:h-32 object-cover"
          src={menu.dishImage || defaultImage}
          alt="Food"
        />
      </div>

      <div className="flex h-[80px] gap-5 justify-between items-center mt-2 mx-2  ">
        <div className="font-raleway ">
          <h2 className="font-semibold text-gray-800 multi-line-truncate">
            {menu.dishName}{" "}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{menu.price} MMK</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            className="block md:hidden m-2 bg-red-500 text-white p-2 rounded-md hover:scale-95 active:scale-105"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2Icon size={17} />
          </button>
          <button
            className="bg-secondary text-primary p-2 rounded-md border border-primary active:scale-105"
            onClick={() => setIsModalOpen(true)}
          >
            <Edit3Icon size={17} />
          </button>
        </div>
      </div>

      <button
        className="hidden md:block absolute top-0 right-0 m-2 bg-red-500 text-white p-2 rounded-md hover:scale-95 active:scale-105"
        onClick={() => setIsDeleteOpen(true)}
      >
        <Trash2Icon size={17} />
      </button>

      <EditMenuModel
        isOpen={isModalOpen}
        menu={menu}
        onClose={() => setIsModalOpen(false)}
      />

      <DeleteModel
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        submit={() => deleteItems(menu._id)}
      />
    </div>
  );
};

MenuCard.propTypes = {
  menu: PropTypes.shape({
    dishImage: PropTypes.string.isRequired,
    dishName: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    _id: PropTypes.string.isRequired,
  }).isRequired,
  refreshMenu: PropTypes.func.isRequired,
};

export default MenuCard;
