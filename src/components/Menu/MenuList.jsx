import { useEffect, useState } from "react";
import MenuModel from "./MenuModel";
import MenuCard from "./MenuCard";
import getItems from "../../api/Menu/getItems";
import NoItems from "../NoItems";
import Loading from "../Loading";
// import Modal from "./Modal"; // Import the Modal component

const MenuList = ({ isModalOpen2 }) => {
  // console.log(category);
  const [menuLists, setMenuList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filteredMenuList, setFilteredMenuList] = useState([]);

  const getMenuList = async () => {
    const res = await getItems();
    setLoading(false);
    if (res.status === "success") {
      console.log("item List", res.data);
      const menus = res.data;
      const categoryList = [...new Set(menus.map((menu) => menu.category))];
      setCategoryList(categoryList);
      setMenuList(menus);
      console.log("categoryList", categoryList);
      setSelectedCategory(categoryList[0]);
    } else {
      setMenuList([]);
      setSelectedCategory("");
    }
  };

  useEffect(() => {
    getMenuList();
  }, [isModalOpen, isModalOpen2]);

  if (loading) {
    return (
      <div className="flex w-full justify-center items-center">
        <Loading />
      </div>
    );
  }

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
      <div className="w-full overflow-x-auto md:overflow-hidden flex md:flex-wrap gap-5 me-[200px] md:me-[0] hide-scrollbar">
        {categoryList.map((category, index) => (
          <div key={index} className="flex items-center gap-2 cursor-pointer">
            <button
              className={`${
                selectedCategory === category
                  ? "bg-prilight text-primary"
                  : "bg-white text-black"
              } font-bold text-[14px] px-5 py-2 rounded-3xl transition duration-200 hover:bg-prilight hover:text-primary focus:outline-none focus:scale-105`}
              onClick={() => setSelectedCategory(category)}
            >
              <p className="font-bold">{category}</p>
            </button>
          </div>
        ))}
      </div>
      {menuLists.map((menu) => {
        return selectedCategory === menu.category ? (
          <MenuCard key={menu._id} menu={menu} refreshMenu={getMenuList} />
        ) : null;
      })}
    </div>
  );
};

export default MenuList;
