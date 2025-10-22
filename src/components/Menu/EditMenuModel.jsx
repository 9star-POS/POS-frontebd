// CreateMenu.js
import { useState } from "react";
import PropTypes from "prop-types";
import updateMenu from "../../api/Menu/UpdateItem";

const EditMenuModel = ({ isOpen, onClose, menu }) => {
  const [dishCategory, setDishCategory] = useState("Western");
  const [dishName, setDishName] = useState(menu.dishName);
  const [price, setPrice] = useState(menu.price);
  const [image, setImage] = useState(null);

  const handleImageUpload = (e) => {
    setImage(e.target.files[0]);
  };

  const handleRemoveImage = () => {
    setImage(null); // Clear the image state
  };

  const handleAddDish = async () => {
    const formData = new FormData();
    formData.append("dishName", dishName);
    formData.append("price", price);
    formData.append("dishImage", image);
    console.log(formData);
    const res = await updateMenu({ id: menu._id, formData });
    console.log(res);
    onClose();
    setImage(null);
    // Handle adding the dish here
    console.log("Dish Added:", { dishCategory, dishName, price, image });
    onClose(); // Close the modal after adding the dish
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
      <div className="border border-gray-300 shadow-lg py-5 px-10 rounded-md bg-white h-full md:h-auto overflow-y-auto">
        {/* <h2 className="text-xl font-semibold mb-4">Create Menu</h2>
        <div className="flex justify-between gap-5 me-5 mt-4 absolute top-0 right-0">
          <button
            onClick={onClose}
            className="border border-gray-300 w-32 rounded-md px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleAddDish}
            className="bg-black text-white w-32 rounded-md px-4 py-2 hover:bg-blue-700"
          >
            Edit Dish
          </button>
        </div> */}
        <div className="flex justify-between">
          <h2 className="sub-header">Edit Menu</h2>
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
        <div className="flex flex-col md:flex-row gap-5 mt-5">
          <div className="w-full md:w-1/2">
            <div className="mb-4">
              <div className="">
                {image ? (
                  <div className="relative md:w-[300px] h-48 border border-primary rounded-md mb-2 flex items-center justify-center">
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
                  </div>
                ) : (
                  <div className="relative md:w-[300px] h-48 border border-primary rounded-md mb-2 flex items-center justify-center overflow-hidden">
                    {menu.dishImage ? (
                      <img
                        src={menu.dishImage}
                        alt="Dish"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400">No Image Uploaded</span>
                    )}
                  </div>
                )}
              </div>
              <input
                type="file"
                id="file-upload"
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="flex justify-between items-center border border-primary rounded-md">
                <p className="ms-2 font-medium text-primary">
                  Upload Dish Image
                </p>
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-white bg-primary text-sm rounded-md px-4 py-1 m-2 text-center hover:bg-prilight hover:text-white border boder-primary transition"
                >
                  Upload
                </label>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2">
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
              <div className="flex">
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter Your Price"
                  className="border border-primary rounded-md p-2 flex-grow"
                />
                <span className="border border-primary rounded-md p-2 ml-2">
                  MMK
                </span>
              </div>
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

EditMenuModel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default EditMenuModel;
