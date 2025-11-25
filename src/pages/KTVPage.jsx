import { useEffect, useState } from "react";
import MenuList from "../components/KTV/MenuList";
import TableSelection from "../components/Home/TableModel";
import Receipt from "../components/KTV/Receipt";
import getItems from "../api/Menu/getItems";
import Loading from "../components/Loading";
import NoItems from "../components/NoItems";
import { useSelector } from "react-redux";
import VocalistModal from "../components/KTV/VocalistModal";
import { MoveLeft, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

function KTVPage() {
  const navigate = useNavigate();
  const selectedRoom = useSelector((state) => state.ktvReceipts.selectedRoom);
  const [isVisible, setisVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  const [categorys, setCategorys] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isVocalistModalOpen, setIsVocalistModalOpen] = useState(false);

  const tables = [1, 2, 3, 4, 5];

  const getAllCategory = async () => {
    setLoading(true);
    const res = await getItems();

    if (res?.success) {
      const restaurantItems = res.data.filter((i) => i.type === "ktv");
      const categoryArray = [
        ...new Set(restaurantItems.map((item) => item.subCategory)),
      ];
      setCategorys(categoryArray);
      setSelectedCategory(categoryArray[0]);
      setLoading(false);
    } else if (res?.status === 401) {
      setLoading(false);
      window.location.href = "/login";
    } else {
      setLoading(false);
      setCategorys([]);
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
        {/* <TablePage tables={tables} /> */}
        <div className="flex flex-col h-[calc(100vh-90px)]  md:flex-row">
          <div className="w-screen md:w-1/2 lg:w-2/3 overflow-y-auto min-h-screen px-5 pt-2 overflow-x-hidden">
            <div className="flex gap-4 items-center mb-5 flex-wrap">
              <MoveLeft
                size={20}
                className="cursor-pointer"
                onClick={() => navigate("/ktv")}
              />
              <span className="sub-header">Menu</span>
              <span className="text-gray-500">
                ( Ordering for room {selectedRoom} )
              </span>
              <button
                className="ml-auto bg-primary font-bold text-white px-4 py-2 rounded-md border border-primary transition duration-200 hover:bg-white hover:text-primary focus:outline-none focus:scale-105 flex items-center gap-2"
                onClick={() => setIsVocalistModalOpen(true)}
                disabled={!selectedRoom}
              >
                <UserPlus size={18} />
                Add Vocalist
              </button>
            </div>
            <div className="w-full overflow-y-auto lg:overflow-hidden flex lg:flex-wrap gap-1 md:gap-5 me-[200px] md:me-0">
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
            <div className="w-full fixed bottom-2 left-0 px-5">
              <button
                type="button"
                className=" md:hidden w-full p-5 text-md font-bold text-center text-white bg-primary rounded-full"
                onClick={() => setisVisible(!isVisible)}
              >
                View Receipt
              </button>
            </div>
          </div>

          <div className="hidden md:block md:w-1/2 lg:w-1/3 border-l border-gray-300">
            <Receipt />
          </div>
          <div
            className={`md:hidden w-screen z-50 fixed h-screen bg-white text-white transition-transform duration-300 transform ${
              isVisible ? "translate-y-[-70px]" : "translate-y-full"
            }`}
          >
            <Receipt onClose={() => setisVisible(!isVisible)} />
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

        {/* Vocalist Modal */}
        <VocalistModal
          isOpen={isVocalistModalOpen}
          onClose={() => setIsVocalistModalOpen(false)}
        />
      </div>
    );
  }
}

export default KTVPage;
