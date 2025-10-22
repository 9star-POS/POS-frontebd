import { useEffect, useState } from "react";
import MenuList from "../components/Orders/MenuList";
import { motion } from "framer-motion";
import OrderDetail from "./../components/Orders/OrderDetail";
import LoadingSpinner from "../components/LoadingSpinner";
import getItems from "../api/Menu/getItems";

import "./../components/Orders/model.css";
// import { selectTable, addItemToReceipt } from "./../redux/receiptS

function EditOrder({ id, closeOrderDetails, editedOrder }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categorys, setCategorys] = useState([]);
  const [menuItem, setMenuItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMobileOpen, setIsEditMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state

  // Motion variants for animation
  const modalVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  const editClick = () => {
    setIsModalOpen(!isModalOpen);
  };

  const getAllCategory = async () => {
    setLoading(true); // Set loading to true when fetching data
    const res = await getItems();
    if (res.code === 200) {
      const categoryArray = [
        ...new Set(res.data.map((item) => item.categoryName)),
      ];
      // console.log("categoryArray", categoryArray);
      setCategorys(categoryArray);
      setSelectedCategory(categoryArray[0]);
      setLoading(false);
    }
  };

  const itemData = (item) => {
    // console.log("item data", item);
    setMenuItem(item);
  };

  useEffect(() => {
    getAllCategory();
  }, []);

  return (
    <div className="">
      <div className="flex w-screen h-screen justify-end">
        {/* Desktop */}
        <div
          className={`w-full hidden md:block md:w-2/3 overflow-hidden h-screen bg-opacity-0 `}
        >
          {/* Menu*/}
          {isModalOpen && !loading && (
            <motion.div
              className="bg-white px-5 h-screen pt-2 h-screen overflow-y-auto"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }} // Duration of the animation
            >
              <div className="flex justify-between items-center">
                <p className="sub-header font-bold mb-5">Menu</p>
              </div>
              <div className="flex flex-wrap gap-5">
                {categorys.map((category, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 cursor-pointer"
                  >
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
              <MenuList category={selectedCategory} getItem={itemData} />
            </motion.div>
          )}
          {isModalOpen && loading && <LoadingSpinner />}
        </div>
        {/* Mobile */}
        <div
          className={`w-full overflow-hidden h-screen bg-opacity-0 ${
            isEditMobileOpen ? "block" : "hidden"
          }`}
        >
          {/* Menu*/}
          {isModalOpen && !loading && (
            <motion.div
              className="bg-white px-5 h-screen pt-2 h-screen overflow-y-auto"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }} // Duration of the animation
            >
              <div className="flex justify-between items-center mb-5">
                <p className="sub-header font-bold">Menu</p>
                <button
                  className="md:hidden p-2 rounded-md bg-primary text-white"
                  onClick={() => setIsEditMobileOpen(!isEditMobileOpen)}
                >
                  Close Menu
                </button>
              </div>
              <div className="flex flex-wrap gap-5">
                {categorys.map((category, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 cursor-pointer"
                  >
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
              <MenuList category={selectedCategory} getItem={itemData} />
            </motion.div>
          )}
          {isModalOpen && loading && <LoadingSpinner />}
        </div>

        {/* Receipt */}

        <div
          className={`w-full md:w-1/3 border-l bor-gray-300 ${
            isEditMobileOpen ? "hidden" : "block"
          }`}
        >
          <div className="">
            <OrderDetail
              closeOrderDetails={closeOrderDetails}
              menuItem={menuItem}
              editClick={editClick}
              mobileEditClick={() => setIsEditMobileOpen(!isEditMobileOpen)}
              id={id}
              editedOrderClick={editedOrder}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditOrder;
