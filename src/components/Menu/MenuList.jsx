import { useEffect, useState } from "react";
import MenuModel from "./MenuModel";
import MenuCard from "./MenuCard";
import getItems from "../../api/Menu/getItems";
import PropTypes from "prop-types";
import NoItems from "../NoItems";
// import Modal from "./Modal"; // Import the Modal component

const MenuList = ({ category, isModalOpen2 }) => {
  // console.log(category);
  const [menuLists, setMenuList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getMenuList = async () => {
    const res = await getItems();

    // console.log("item List", res.data);
    const menus = res.data.filter((menu) => menu.categoryName === category);
    // console.log("menus", menus);
    setMenuList(menus);
    // setMenuList(res.data);
  };

  useEffect(() => {
    getMenuList();
  }, [isModalOpen, category, isModalOpen2]);

  if (menuLists.length === 0) {
    return (
      <div className="flex w-full justify-center items-center">
        <div className="text-center mt-20">
          <NoItems
            header="No Menu at the Moment!"
            subHeader="Set Up your Shop Menu"
          />
        </div>
        <div className="">
          <MenuModel
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-5 mt-5 pb-40">
      {menuLists.map((menu) => {
        return menu.categoryName === category
          ? menu.items.map((item) => (
              <MenuCard key={item._id} menu={item} refreshMenu={getMenuList} />
            ))
          : null;
      })}
    </div>
  );
};

MenuList.propTypes = {
  category: PropTypes.string.isRequired,
};

export default MenuList;
