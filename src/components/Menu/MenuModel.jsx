// CreateMenu.js
import { useState } from "react";
import axios from "../../api/axios";
import defaultMenu from "./../../assets/defaultMenu.jpg";
import PropTypes from "prop-types";

const MenuModel = ({ isOpen, onClose, category }) => {
  const [dishCategory, setDishCategory] = useState();
  const [dishName, setDishName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [itemType, setItemType] = useState("restaurant");
  const [quantity, setQuantity] = useState("1");
  const [newCategory, setNewCategory] = useState("");
  // console.log(dishCategory);

  const handleImageUpload = (e) => {
    setImage(e.target.files[0]);
  };

  const handleRemoveImage = () => {
    setImage(null); // Clear the image state
  };

  const handleAddDish = async () => {
    const formData = new FormData();
    formData.append("name", dishName);
    formData.append("price", price);
    formData.append("quantity", quantity);
    const chosenCategory =
      (newCategory && newCategory.trim()) ||
      dishCategory ||
      (category && category[0]);
    if (chosenCategory) {
      formData.append("category", chosenCategory);
    }
    formData.append("type", itemType);
    if (image) {
      formData.append("images", image);
    }

    const res = await axios.post("api/v1/stock", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    const data = res?.data;
    if (data?.code === 201) {
      onClose();
      setDishName("");
      setPrice("");
      setQuantity("1");
      setNewCategory("");
      setImage(null);
      // keep selected category as-is
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80">
      <div className="border border-gray-300 shadow-lg py-6 px-6 md:px-8 rounded-md bg-white w-full max-w-5xl h-full md:h-auto overflow-y-auto">
        <div className="flex items-start justify-between">
          <h2 className="sub-header">Create Menu</h2>
          <div className="hidden md:flex justify-between gap-5 me-5 mt-4">
            <button
              onClick={onClose}
              className="border border-primary w-32 rounded-md px-4 py-2 text-primary hover:bg-primary hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleAddDish}
              className="bg-primary border border-primary text-white w-32 rounded-md px-4 py-2 hover:bg-white hover:text-primary"
            >
              Add Dish
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <div className="w-full">
            <div className="space-y-3">
              <div className="relative w-full h-56 md:h-80 border border-primary rounded-md mb-2 flex items-center justify-center overflow-hidden bg-white">
                {image ? (
                  <>
                    <img
                      src={URL.createObjectURL(image)}
                      alt="Dish"
                      className="w-full h-full object-cover"
                    />
                    {/* Remove Image Button */}
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-black text-white rounded-md px-3 hover:bg-red-700"
                      aria-label="Remove Image"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <img
                    src={defaultMenu}
                    alt="Dish"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <input
                type="file"
                id="file-upload"
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="flex items-center justify-between border border-primary rounded-md px-3 py-2">
                <p className="font-medium text-primary">Upload Dish Image</p>
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-white bg-primary text-sm rounded-md px-4 py-1 text-center hover:bg-prilight hover:text-white border boder-primary transition"
                >
                  Upload
                </label>
              </div>
            </div>
          </div>
          <div className="w-full">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Type a new category"
                className="border border-primary rounded-md p-2 w-full"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Type</label>
              <div className="inline-grid grid-cols-2 rounded-md border border-primary overflow-hidden">
                <button
                  type="button"
                  onClick={() => setItemType("restaurant")}
                  className={`px-4 py-1 transition ${
                    itemType === "restaurant"
                      ? "bg-primary text-white"
                      : "bg-white text-primary"
                  }`}
                >
                  Restaurant
                </button>
                <button
                  type="button"
                  onClick={() => setItemType("ktv")}
                  className={`px-4 py-1 border-l border-primary transition ${
                    itemType === "ktv"
                      ? "bg-primary text-white"
                      : "bg-white text-primary"
                  }`}
                >
                  KTV
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Dish Name
              </label>
              <input
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="Enter Your Dish Name"
                className="border border-primary rounded-md p-2 w-full"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Price</label>
              <div className="relative">
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter Your Price"
                  className="border border-primary rounded-md p-2 w-full pr-16"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 border border-primary rounded-md px-3 py-1 text-sm">
                  MMK
                </span>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter Quantity"
                className="border border-primary rounded-md p-2 w-full"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-4 md:hidden">
          <button
            onClick={onClose}
            className="border border-primary w-32 rounded-md px-4 py-2 text-primary hover:bg-primary hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleAddDish}
            className="bg-primary border border-primary text-white w-32 rounded-md px-4 py-2 hover:bg-white hover:text-primary"
          >
            Add Dish
          </button>
        </div>
      </div>
    </div>
  );
};

MenuModel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  // category: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default MenuModel;
