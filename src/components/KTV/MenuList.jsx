import { useEffect, useState } from "react";
import KtvMenuCard from "./MenuCard";
import getItems from "../../api/Menu/getItems";
import NoItems from "../NoItems";
import Loading from "../Loading";

const KtvMenuList = ({ category }) => {
  const [menuLists, setMenuList] = useState([]);
  const [loading, setLoading] = useState(true);

  const getMenuList = async () => {
    const res = await getItems();
    if (res?.status === "success") {
      const ktvItems = res.data.filter((i) => i.type === "ktv");
      setMenuList(ktvItems);
      setLoading(false);
    } else {
      setMenuList([]);
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
        </div>
      </div>
    );
  }

  if (!loading && menuLists.length > 0) {
    return (
      <div className="flex flex-col lg:flex-row lg:flex-wrap gap-5 mt-5 pb-40">
        {menuLists.map((menu) => {
          return category === menu.category ? (
            <KtvMenuCard key={menu._id} menu={menu} />
          ) : null;
        })}
      </div>
    );
  }
};

export default KtvMenuList;
