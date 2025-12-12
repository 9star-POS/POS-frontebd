import { useEffect, useState } from "react";
import MenuModel from "./../Menu/MenuModel";
import MenuCard from "./MenuCard";
import getItems from "../../api/Menu/getItems";
import NoItems from "../NoItems";
import Loading from "../Loading";

const MenuList = ({ category }) => {
  const [menuLists, setMenuList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subcategories, setSubcategories] = useState([]);

  const getMenuList = async () => {
    const res = await getItems();
    if (res?.success === true) {
      const restaurantItems = res.data.filter((i) => i.type === "restaurant");
      setMenuList(restaurantItems);
      // Extract unique subcategories
      const subcats = [
        ...new Set(restaurantItems.map((menu) => menu.subCategory)),
      ].filter(Boolean);
      setSubcategories(subcats);
      setLoading(false);
    } else {
      setMenuList([]);
      setSubcategories([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    getMenuList();
  }, []);

  if (loading) {
    return (
      <div className="">
        <Loading />
      </div>
    );
  }

  if (!loading && menuLists.length === 0) {
    return (
      <div className="flex w-full justify-center items-center">
        <div className="text-center">
          <NoItems
            header="No Menu at the Moment!"
            subHeader="Set Up your Shop Menu"
          />
          <button
            className=" mt-5 bg-primary text-xl text-white py-2 px-10 rounded-md
                     transition duration-200 hover:text-primary hover:bg-black hover:border hover:border-primary"
            onClick={() => setIsModalOpen(true)}
          >
            Create Menu Category
          </button>
        </div>
        <div className="">
          <MenuModel
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            subcategories={subcategories}
            menuType="restaurant"
          />
        </div>
      </div>
    );
  }

  if (!loading && menuLists.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-5 pb-40">
        {menuLists.map((menu) => {
          return category === menu.subCategory ? (
            <MenuCard key={menu._id} menu={menu} />
          ) : null;
        })}
      </div>
    );
  }
};

export default MenuList;
