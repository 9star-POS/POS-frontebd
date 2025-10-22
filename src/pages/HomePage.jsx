import { useEffect, useState } from "react";
import MenuList from "../components/Home/MenuList";
import TableSelection from "../components/Home/TableModel";
import Receipt from "../components/Home/Receipt";
import getItems from "../api/Menu/getItems";
import Loading from "../components/Loading";
import NoItems from "../components/NoItems";
// import { useNavigate } from "react-router-dom";
// import { selectTable, addItemToReceipt } from "./../redux/receiptS

function HomePage({ isVisible }) {
  // const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  const [categorys, setCategorys] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const tables = [1, 2, 3, 4, 5];

  const getAllCategory = async () => {
    setLoading(true);
    const res = await getItems();
    // console.log("home", res);
    if (res.code === 200) {
      setLoading(false);
      const categoryArray = [
        ...new Set(res.data.map((item) => item.categoryName)),
      ];
      // console.log("categoryArray", categoryArray);
      setCategorys(categoryArray);
      setSelectedCategory(categoryArray[0]);
    } else if (res.status === 401) {
      window.location.href = "/login";
      // c327b24a-c464-4880-b6cf-ead3750a3977
    }
  };

  useEffect(() => {
    getAllCategory();
  }, []);

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
        <NoItems
          header={"No Menu at the Moment!"}
          subHeader="Set Up your Shop Menu"
        />
      </div>
    );
  }

  if (!loading && categorys.length > 0) {
    return (
      <div className="">
        <div className="flex flex-col md:flex-row">
          {/* Menu*/}
          <div className="lg:w-2/3 overflow-y-auto h-screen px-5 pt-2 overflow-x-hidden">
            <div className="flex justify-between items-center mb-5">
              <span className="sub-header">Menu</span>
              <button
                className="bg-primary font-bold text-white px-4 py-2 md:me-5 rounded-md border border-primary transition duration-200 hover:bg-white hover:text-primary focus:outline-none focus:scale-105"
                onClick={() => setIsOpen(true)}
              >
                Select Table
              </button>
            </div>
            <div className="w-full md:w-full overflow-y-auto md:overflow-hidden flex md:flex-wrap gap-1 md:gap-5 me-[200px] md:me-0 hide-scrollbar">
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
            <MenuList category={selectedCategory} />
          </div>
          {/* Receipt */}
          <div className="hidden md:block lg:w-1/3 border-l border-gray-300 ">
            <Receipt />
          </div>
          <div
            className={`md:hidden w-full rounded-lg fixed h-screen bg-white text-white transition-transform duration-300 transform ${
              isVisible ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <Receipt />
          </div>
        </div>
        {/* Table Model */}
        <div className="flex justify-between items-center">
          <TableSelection
            tables={tables}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        </div>
      </div>
    );
  }
}

export default HomePage;
