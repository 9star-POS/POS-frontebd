import { useEffect, useState } from "react";
import CategoryModal from "../components/Menu/CategoryModel";
import MenuList from "../components/Menu/MenuList";
import getMenu from "../api/Menu/getMenu";
import MenuModel from "../components/Menu/MenuModel";
import Loading from "../components/Loading";

function MenuPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpen2, setIsModalOpen2] = useState(false);
  const [categorys, setCategorys] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState();
  const [loading, setLoading] = useState(true);
  // const [id, setId] = useState("");

  const getAllCategory = async () => {
    setLoading(true);
    const res = await getMenu();
    // console.log(res);
    if (res.code === 200) {
      setLoading(false);
      setCategorys(res.data.categories[0].categories);
      // setId(res.data.categories[0]._id);
      setSelectedCategory(res.data.categories[0].categories[0]);
    }
  };

  useEffect(() => {
    getAllCategory();
  }, [isModalOpen]);

  if (loading) {
    return (
      <div className="flex w-full h-screen justify-center items-center overflow-y-auto">
        <Loading />
      </div>
    );
  }

  if (!loading && categorys.length === 0) {
    return (
      <div className="flex w-full h-screen justify-center items-center overflow-y-auto">
        <div className="text-center">
          <p className="font-mediun text-3xl">No Menu at the Moment!</p>
          <p className="font-medium text-3xl">Set Up your Shop Menu</p>
          <button
            className=" mt-5 bg-primary text-xl text-black py-2 px-10 rounded-md
                     transition duration-200 hover:text-primary hover:bg-black hover:border hover:border-primary"
            onClick={() => setIsModalOpen(true)}
          >
            Create Menu Category
          </button>
        </div>
        <div className="">
          <CategoryModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        </div>
      </div>
    );
  }

  if (!loading && categorys.length > 0) {
    return (
      <>
        <div className="p-5">
          <div className="mb-5">
            <p className="sub-header">Menu Management</p>
          </div>
          <div className="flex flex-col md:flex-row gap-1">
            <div className="w-full overflow-x-auto md:overflow-hidden flex md:flex-wrap gap-5 me-[200px] md:me-[0] hide-scrollbar">
              <button
                className="md:hidden text-primary px-5 rounded-md transition duration-20 hover:bg-white hover:text-primary focus:outline-none focus:scale-105 cursor-pointer"
                onClick={() => setIsModalOpen(true)}
              >
                <p className="font-bold text-xl">+</p>
              </button>
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
              <button
                className="hidden md:block bg-primary text-white px-4 py-2 rounded-md transition duration-200 border border-primary hover:bg-white hover:text-primary focus:outline-none focus:scale-105 cursor-pointer"
                onClick={() => setIsModalOpen(true)}
              >
                <p className="font-bold">+</p>
              </button>
            </div>
            <div className="py-2 md:py-0">
              <button
                className="bg-primary w-full md:w-48 text-white px-4 py-2 rounded-md transition duration-200 border border-primary hover:bg-white hover:text-primary focus:outline-none focus:scale-105"
                onClick={() => setIsModalOpen2(true)}
              >
                <p className="font-bold">Add Menu</p>
              </button>
            </div>
          </div>
          <div className="overflow-y-auto h-[70vh]">
            <MenuList category={selectedCategory} isModalOpen2={isModalOpen2} />
          </div>

          <CategoryModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
          <MenuModel
            isOpen={isModalOpen2}
            onClose={() => setIsModalOpen2(false)}
            category={categorys}
          />
        </div>
      </>
    );
  }
}

export default MenuPage;
