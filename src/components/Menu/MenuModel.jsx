// CreateMenu.js
import { useState, useEffect, useRef } from "react";
import axios from "../../api/axios";
import defaultMenu from "./../../assets/black.jpg";
import PropTypes from "prop-types";

const MenuModel = ({ isOpen, onClose, subcategories, menuType }) => {
  const [dishCategory, setDishCategory] = useState();
  const [dishName, setDishName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [itemType, setItemType] = useState(menuType || "restaurant");
  const [quantity, setQuantity] = useState("");
  const [requireCooking, setRequireCooking] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const subcategoryInputRef = useRef(null);
  // console.log(dishCategory);

  // Update itemType when menuType prop changes
  useEffect(() => {
    if (menuType) {
      setItemType(menuType);
    }
  }, [menuType]);

  // Clear quantity when requireCooking is enabled
  useEffect(() => {
    if (requireCooking) {
      setQuantity("");
    }
  }, [requireCooking]);

  // Close subcategory dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        subcategoryInputRef.current &&
        !subcategoryInputRef.current.contains(event.target)
      ) {
        setShowSubcategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImageUpload = (e) => {
    setImage(e.target.files[0]);
  };

  const handleRemoveImage = () => {
    setImage(null); // Clear the image state
  };

  const handleSubcategorySelect = (selectedSubcat) => {
    setSubcategory(selectedSubcat);
    setShowSubcategoryDropdown(false);
  };

  const handleClose = () => {
    setError("");
    setLoading(false);
    onClose();
  };

  // Clear error when user starts typing
  const clearErrorOnChange = () => {
    if (error) setError("");
  };

  const handleAddDish = async () => {
    // Clear any previous errors
    setError("");
    setLoading(true);

    try {
      // Basic validation
      if (!dishName.trim()) {
        setError("Dish name is required");
        setLoading(false);
        return;
      }
      if (!price.trim()) {
        setError("Price is required");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("name", dishName);
      formData.append("price", price);
      // Only append quantity if requireCooking is false and quantity has a value
      if (!requireCooking && quantity && quantity.trim() !== "") {
        formData.append("quantity", quantity);
      }
      formData.append("requiresPreparation", requireCooking);
      const chosenCategory =
        (newCategory && newCategory.trim()) || dishCategory;
      if (chosenCategory) {
        formData.append("category", chosenCategory);
      }
      if (subcategory && subcategory.trim()) {
        formData.append("subCategory", subcategory.trim());
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
        // Clear all form data and close modal on success
        setDishName("");
        setPrice("");
        setQuantity("");
        setRequireCooking(false);
        setNewCategory("");
        setSubcategory("");
        setImage(null);
        setError("");
        setLoading(false);
        onClose();
        // keep selected category as-is
      } else {
        // Handle non-201 success responses
        setError(data?.message || "Failed to create menu item");
      }
    } catch (error) {
      console.error("Error creating menu item:", error);

      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        const errorData = error.response.data;
        const statusCode = error.response.status;

        if (statusCode === 400) {
          setError(
            errorData?.message ||
              "Invalid input data. Please check your entries."
          );
        } else if (statusCode === 401) {
          setError("You are not authorized to perform this action.");
        } else if (statusCode === 409) {
          setError("A menu item with this name already exists.");
        } else if (statusCode >= 500) {
          setError("Server error. Please try again later.");
        } else {
          setError(
            errorData?.message ||
              `Error ${statusCode}: Failed to create menu item`
          );
        }
      } else if (error.request) {
        // Network error
        setError("Network error. Please check your connection and try again.");
      } else {
        // Other error
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
      <div className="border border-gray-300 shadow-lg py-6 px-6 md:px-8 rounded-md bg-white w-full max-w-5xl h-full md:h-auto overflow-y-auto">
        <div className="flex items-start justify-between">
          <h2 className="sub-header">Create Menu</h2>
          <div className="hidden md:flex justify-between gap-5 me-5 mt-4">
            <button
              onClick={handleClose}
              disabled={loading}
              className="border border-primary w-32 rounded-md px-4 py-2 text-primary hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleAddDish}
              disabled={loading}
              className="bg-primary border border-primary text-white w-32 rounded-md px-4 py-2 hover:bg-white hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Add Dish"}
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
              <select
                value={newCategory}
                onChange={(e) => {
                  setNewCategory(e.target.value);
                  clearErrorOnChange();
                }}
                className="border border-primary rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select Category</option>
                <option value="food">Food</option>
                <option value="drink">Drink</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="mb-4" ref={subcategoryInputRef}>
              <label className="block text-sm font-medium mb-1">
                Subcategory
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => {
                    setSubcategory(e.target.value);
                    clearErrorOnChange();
                  }}
                  onFocus={() => setShowSubcategoryDropdown(true)}
                  placeholder="Type a new subcategory or select existing"
                  className="border border-primary rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {showSubcategoryDropdown &&
                  subcategories &&
                  subcategories.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      <div className="p-2">
                        <p className="text-xs text-gray-500 mb-2 font-semibold">
                          Existing Subcategories:
                        </p>
                        {subcategories
                          .filter((subcat) =>
                            subcat
                              .toLowerCase()
                              .includes(subcategory.toLowerCase())
                          )
                          .map((subcat, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSubcategorySelect(subcat)}
                              className="w-full text-left px-3 py-2 hover:bg-prilight hover:text-primary rounded-md transition-colors"
                            >
                              {subcat}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
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
                onChange={(e) => {
                  setDishName(e.target.value);
                  clearErrorOnChange();
                }}
                placeholder="Enter Your Dish Name"
                className="border border-primary rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Price</label>
              <div className="relative">
                <input
                  type="text"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    clearErrorOnChange();
                  }}
                  placeholder="Enter Your Price"
                  className="border border-primary rounded-md p-2 w-full pr-16 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 border border-primary rounded-md px-3 py-1 text-sm">
                  MMK
                </span>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireCooking"
                  checked={requireCooking}
                  onChange={(e) => setRequireCooking(e.target.checked)}
                  className="mr-2 h-4 w-4 text-primary focus:ring-primary border-primary rounded"
                />
                <label htmlFor="requireCooking" className="text-sm font-medium">
                  Requires Preparation
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Check this if the item needs to be prepared/cooked
              </p>
            </div>
            {!requireCooking && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Quantity{" "}
                  <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    clearErrorOnChange();
                  }}
                  placeholder="Enter Quantity (Optional)"
                  className="border border-primary rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        <div className="flex justify-between mt-4 md:hidden">
          <button
            onClick={handleClose}
            disabled={loading}
            className="border border-primary w-32 rounded-md px-4 py-2 text-primary hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleAddDish}
            disabled={loading}
            className="bg-primary border border-primary text-white w-32 rounded-md px-4 py-2 hover:bg-white hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Adding..." : "Add Dish"}
          </button>
        </div>
      </div>
    </div>
  );
};

MenuModel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  subcategories: PropTypes.array,
  menuType: PropTypes.string,
};

export default MenuModel;
