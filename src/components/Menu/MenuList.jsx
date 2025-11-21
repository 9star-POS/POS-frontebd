import { useEffect, useState } from "react";
import MenuModel from "./MenuModel";
import MenuCard from "./MenuCard";
import getItems from "../../api/Menu/getItems";
import NoItems from "../NoItems";
import Loading from "../Loading";
// import Modal from "./Modal"; // Import the Modal component

const MenuList = ({ isModalOpen2, onMenuTypeChange }) => {
  // console.log(category);
  const [menuLists, setMenuList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoryList, setCategoryList] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [menuType, setMenuType] = useState("restaurant"); // "restaurant" or "ktv"

  // Notify parent when menu type changes
  const handleMenuTypeChange = (type) => {
    setMenuType(type);
    if (onMenuTypeChange) {
      onMenuTypeChange(type);
    }
  };

  const getMenuList = async () => {
    const res = await getItems();
    setLoading(false);
    if (res?.success) {
      // console.log("item List", res.data);
      const menus = res.data;
      setMenuList(menus);

      // Filter categories based on selected menu type
      const filteredMenus = menus.filter((menu) => menu.type === menuType);
      const categoryList = [
        "All",
        ...new Set(filteredMenus.map((menu) => menu.subCategory)),
      ];
      setCategoryList(categoryList);
      console.log("categoryList", categoryList);
    } else {
      setMenuList([]);

      setCategoryList(["All"]);
    }
  };

  // console.log("selectedCategory", selectedCategory);

  useEffect(() => {
    getMenuList();
  }, [isModalOpen, isModalOpen2, menuType]);

  if (loading) {
    return (
      <div className="flex w-full justify-center items-center">
        <Loading />
      </div>
    );
  }

  // Filter menus by type
  const filteredMenus = menuLists.filter((menu) => menu.type === menuType);

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
            subcategories={categoryList.filter((cat) => cat !== "All")}
            menuType={menuType}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-40">
      {/* Menu Type Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => {
            handleMenuTypeChange("restaurant");
            setSelectedCategory("All");
          }}
          className={`px-6 py-3 font-semibold transition-all ${
            menuType === "restaurant"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Restaurant Menu
        </button>
        <button
          onClick={() => {
            handleMenuTypeChange("ktv");
            setSelectedCategory("All");
          }}
          className={`px-6 py-3 font-semibold transition-all ${
            menuType === "ktv"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          KTV Menu
        </button>
      </div>

      {/* Category Filters */}
      {categoryList.length > 0 && (
        <div className="w-full overflow-x-auto md:overflow-hidden flex md:flex-wrap gap-5 me-[200px] md:me-[0] hide-scrollbar">
          {categoryList.map((category, index) => (
            <div key={index} className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
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
      )}

      {/* Menu Cards */}
      {filteredMenus.length === 0 ? (
        <div className="flex justify-center items-center mt-20">
          <NoItems
            header={`No ${
              menuType === "restaurant" ? "Restaurant" : "KTV"
            } Menu`}
            subHeader={`No ${
              menuType === "restaurant" ? "restaurant" : "KTV"
            } menu items found`}
          />
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-5">
          {filteredMenus.map((menu) => {
            // Show all items if "All" is selected, otherwise filter by subCategory
            return selectedCategory === "All" ||
              selectedCategory === menu.subCategory ? (
              <MenuCard key={menu._id} menu={menu} refreshMenu={getMenuList} />
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};

export default MenuList;
