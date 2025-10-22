import { useEffect, useState } from "react";
// import MenuModel from "./../Menu/MenuModel";
import MenuCard from "./MenuCard";
import getItems from "../../api/Menu/getItems";
import { motion } from "framer-motion";
import Loading from "../Loading";
import NoItems from "../NoItems";

const MenuList = ({ category, getItem }) => {
  const [menuLists, setMenuList] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [isModalOpen, setIsModalOpen] = useState(false);

  const getMenuList = async () => {
    const res = await getItems();
    if (res.code === 200) {
      setLoading(false);
      // console.log("item List", res.data[0].categoryName);
      setMenuList(res.data);
    }
  };

  const sentItem = (item) => {
    // console.log("item sent", item);
    getItem(item);
  };

  useEffect(() => {
    getMenuList();
  }, []);

  if (loading) {
    return (
      <div className="">
        <Loading />;
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
        </div>
      </div>
    );
  }

  if (!loading && menuLists.length > 0) {
    return (
      <motion.div className="flex flex-wrap gap-5 mt-5 pb-40">
        {menuLists.map((menu) => {
          return (
            menu.categoryName === category &&
            menu.items.map((item) => (
              <MenuCard key={item._id} menu={item} sentItem={sentItem} />
            ))
          );
        })}
      </motion.div>
    );
  }
};

export default MenuList;
