import { useEffect, useState } from "react";
import CategoryModal from "../components/Menu/CategoryModel";
import MenuList from "../components/Menu/MenuList";
import getMenu from "../api/Menu/getMenu";
import MenuModel from "../components/Menu/MenuModel";
import Loading from "../components/Loading";
import getItems from "../api/Menu/getItems";

function MenuPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpen2, setIsModalOpen2] = useState(false);
  const [categorys, setCategorys] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [menuType, setMenuType] = useState("restaurant");

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await getItems();
      if (res.success === true) {
        const filteredMenus = res.data.filter((menu) => menu.type === menuType);
        const cats = [
          ...new Set(filteredMenus.map((menu) => menu.category)),
        ].filter(Boolean);
        setCategories(cats);
        // Extract unique subcategories
        const subcats = [
          ...new Set(filteredMenus.map((menu) => menu.subCategory)),
        ].filter(Boolean);
        setSubcategories(subcats);
      }
    };
    fetchCategories();
  }, [isModalOpen2, menuType]);

  return (
    <div className="h-[calc(100vh-50px)] w-screen md:w-full py-3 px-3">
      <div className="flex justify-between mb-3">
        <p className="sub-header">Menu Management</p>
        <div className="py-2 md:py-0">
          <button
            className="bg-primary text-white px-4 py-2 rounded-md transition duration-200 border border-primary hover:bg-white hover:text-primary focus:outline-none focus:scale-105"
            onClick={() => setIsModalOpen2(true)}
          >
            <p className="font-bold">Add Menu</p>
          </button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-1 "></div>
      <div className="overflow-y-auto h-[calc(100vh-180px)] md:h-[calc(100vh-200px)]">
        <MenuList isModalOpen2={isModalOpen2} onMenuTypeChange={setMenuType} />
      </div>

      <MenuModel
        isOpen={isModalOpen2}
        onClose={() => setIsModalOpen2(false)}
        subcategories={subcategories}
        menuType={menuType}
      />
    </div>
  );
}

export default MenuPage;
