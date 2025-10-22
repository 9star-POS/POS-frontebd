import { useEffect, useState } from "react";
import addCategories from "../../api/Menu/addCategory";
import PropTypes from "prop-types";
import getMenu from "../../api/Menu/getMenu";
import pushCategories from "../../api/Menu/pushCategory";

const CategoryModal = ({ isOpen, onClose }) => {
  // console.log(id);
  const [categoryName, setCategoryName] = useState("");
  const [id, setId] = useState("");

  const handleCreate = async () => {
    if (id) {
      console.log(categoryName);
      const data = {
        categories: categoryName,
        id: id,
      };
      const res = await pushCategories(data);
      console.log("push", res);
      if (res.status === "success") {
        onClose();
      }
    } else {
      const data = {
        categoryName: categoryName,
      };
      const res = await addCategories(data);
      console.log(res);
      if (res.status === "success") {
        onClose();
      }
    }
  };

  const getCategoryId = async () => {
    const res = await getMenu();
    // console.log("id", res);
    if (res.code === 200) {
      setId(res.data.categories[0]._id);
    }
  };

  useEffect(() => {
    getCategoryId();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="bg-white rounded-lg shadow-lg p-6 md:w-96">
        <h2 className="sub-header mb-4">Create Menu Category</h2>
        <div className="flex items-center mb-4">
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="border border-gray-300 rounded-md p-2 flex-grow"
            placeholder="Western"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="border border-primary rounded-md px-4 py-2 mr-2 text-primary hover:bg-prilight"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="bg-primary border border-primary font-bold text-white rounded-md px-4 py-2 hover:bg-prilight hover:text-primary"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

CategoryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  // id: PropTypes.string.isRequired,
};

export default CategoryModal;
