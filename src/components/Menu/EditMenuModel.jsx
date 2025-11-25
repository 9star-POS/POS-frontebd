// EditMenu.js
import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import axios from "../../api/axios";
import defaultMenu from "./../../assets/defaultMenu.jpg";
import getItems from "../../api/Menu/getItems";
import { Image, Package, Edit3, X, Eye } from "lucide-react";

const EditMenuModel = ({ isOpen, onClose, menu, refreshMenu }) => {
  // Modal states
  const [activeModal, setActiveModal] = useState(null); // null, 'image', 'quantity', 'data'

  // Image edit state
  const [image, setImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");

  // Quantity edit state
  const [quantity, setQuantity] = useState(menu.quantity?.toString() || "");
  const [requireCooking, setRequireCooking] = useState(
    menu.requiresPreparation || false
  );
  const [quantityLoading, setQuantityLoading] = useState(false);
  const [quantityError, setQuantityError] = useState("");

  // Data edit state
  const [dishName, setDishName] = useState(menu.name);
  const [price, setPrice] = useState(menu.price.toString());
  const [itemType, setItemType] = useState(menu.type || "restaurant");
  const [newCategory, setNewCategory] = useState(menu.category || "");
  const [subcategory, setSubcategory] = useState(menu.subCategory || "");
  const [existingSubcategories, setExistingSubcategories] = useState([]);
  const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const subcategoryInputRef = useRef(null);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveModal(null);
      setImage(null);
      setQuantity(menu.quantity?.toString() || "");
      setRequireCooking(menu.requiresPreparation || false);
      setDishName(menu.name);
      setPrice(menu.price.toString());
      setItemType(menu.type || "restaurant");
      setNewCategory(menu.category || "");
      setSubcategory(menu.subCategory || "");
      setImageError("");
      setQuantityError("");
      setDataError("");
    }
  }, [isOpen, menu]);

  // Fetch subcategories when data modal opens
  useEffect(() => {
    if (activeModal === "data") {
      const fetchSubcategories = async () => {
        const res = await getItems();
        if (res?.success) {
          const filteredMenus = res.data.filter(
            (menuItem) => menuItem.type === itemType
          );
          const subcats = [
            ...new Set(filteredMenus.map((menuItem) => menuItem.subCategory)),
          ].filter(Boolean);
          setExistingSubcategories(subcats);
        }
      };
      fetchSubcategories();
    }
  }, [activeModal, itemType]);

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

  // Clear quantity when requireCooking is enabled
  useEffect(() => {
    if (requireCooking) {
      setQuantity("");
    }
  }, [requireCooking]);

  const handleImageUpload = (e) => {
    setImage(e.target.files[0]);
    setImageError("");
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImageError("");
  };

  const handleSubcategorySelect = (selectedSubcat) => {
    setSubcategory(selectedSubcat);
    setShowSubcategoryDropdown(false);
  };

  const handleClose = () => {
    setActiveModal(null);
    setImage(null);
    setImageError("");
    setQuantityError("");
    setDataError("");
    setImageLoading(false);
    setQuantityLoading(false);
    setDataLoading(false);
    onClose();
  };

  const handleBackToMain = () => {
    setActiveModal(null);
    setImage(null);
    setImageError("");
    setQuantityError("");
    setDataError("");
  };

  // Clear error when user starts typing
  const clearErrorOnChange = (errorType) => {
    if (errorType === "image" && imageError) setImageError("");
    if (errorType === "quantity" && quantityError) setQuantityError("");
    if (errorType === "data" && dataError) setDataError("");
  };

  // Handle Edit Image
  const handleEditImage = async () => {
    if (!image) {
      setImageError("Please select an image to upload");
      return;
    }

    setImageError("");
    setImageLoading(true);

    try {
      const formData = new FormData();
      formData.append("images", image);

      const res = await axios.patch(`api/v1/stock/${menu._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = res?.data;
      if (data?.success) {
        setImage(null);
        setImageLoading(false);
        handleClose();
        if (refreshMenu) refreshMenu();
      } else {
        setImageError(data?.message || "Failed to update image");
      }
    } catch (error) {
      console.error("Error updating image:", error);
      setImageError(error.response?.data?.message || "Failed to update image");
    } finally {
      setImageLoading(false);
    }
  };

  // Handle Edit Quantity
  const handleEditQuantity = async () => {
    setQuantityError("");
    setQuantityLoading(true);

    try {
      const formData = new FormData();

      // Only append quantity if requireCooking is false and quantity has a value
      if (!requireCooking && quantity && quantity.trim() !== "") {
        formData.append("quantity", quantity);
      }
      formData.append("requiresPreparation", requireCooking);

      const res = await axios.patch(`api/v1/stock/${menu._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = res?.data;
      if (data?.success) {
        setQuantityLoading(false);
        handleClose();
        if (refreshMenu) refreshMenu();
      } else {
        setQuantityError(data?.message || "Failed to update quantity");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      setQuantityError(
        error.response?.data?.message || "Failed to update quantity"
      );
    } finally {
      setQuantityLoading(false);
    }
  };

  // Handle Edit Data
  const handleEditData = async () => {
    setDataError("");
    setDataLoading(true);

    try {
      // Basic validation
      if (!dishName.trim()) {
        setDataError("Dish name is required");
        setDataLoading(false);
        return;
      }
      if (!price.trim()) {
        setDataError("Price is required");
        setDataLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("name", dishName);
      formData.append("price", price);

      const chosenCategory = newCategory && newCategory.trim();
      if (chosenCategory) {
        formData.append("category", chosenCategory);
      }
      if (subcategory && subcategory.trim()) {
        formData.append("subCategory", subcategory.trim());
      }

      formData.append("type", itemType);

      const res = await axios.patch(`api/v1/stock/${menu._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = res?.data;
      if (data?.success) {
        setDataLoading(false);
        handleClose();
        if (refreshMenu) refreshMenu();
      } else {
        setDataError(data?.message || "Failed to update menu item");
      }
    } catch (error) {
      console.error("Error updating menu:", error);
      const errorData = error.response?.data;
      const statusCode = error.response?.status;

      if (statusCode === 400) {
        setDataError(
          errorData?.message || "Invalid input data. Please check your entries."
        );
      } else if (statusCode === 401) {
        setDataError("You are not authorized to perform this action.");
      } else if (statusCode === 404) {
        setDataError("Menu item not found.");
      } else if (statusCode === 409) {
        setDataError("A menu item with this name already exists.");
      } else if (statusCode >= 500) {
        setDataError("Server error. Please try again later.");
      } else {
        setDataError(
          errorData?.message ||
            `Error ${statusCode}: Failed to update menu item`
        );
      }
    } finally {
      setDataLoading(false);
    }
  };

  if (!isOpen) return null;

  // Main menu with three buttons
  if (!activeModal) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="border border-gray-300 shadow-lg py-6 px-6 md:px-8 rounded-md bg-white w-full max-w-md mx-4">
          <div className="flex items-start justify-between mb-6">
            <h2 className="sub-header">Edit Menu</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setActiveModal("details")}
              className="w-full flex items-center gap-3 p-3 border-2 border-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
            >
              <Eye size={20} />
              <span className="font-semibold">View Details</span>
            </button>

            <button
              onClick={() => setActiveModal("image")}
              className="w-full flex items-center gap-3 p-3 border-2 border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
            >
              <Image size={20} />
              <span className="font-semibold">Edit Image</span>
            </button>

            {!menu.requiresPreparation && (
              <button
                onClick={() => setActiveModal("quantity")}
                className="w-full flex items-center gap-3 p-3 border-2 border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
              >
                <Package size={20} />
                <span className="font-semibold">Edit Quantity</span>
              </button>
            )}

            <button
              onClick={() => setActiveModal("data")}
              className="w-full flex items-center gap-3 p-3 border-2 border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
            >
              <Edit3 size={20} />
              <span className="font-semibold">Edit Data</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate edit modal
  // Determine modal width based on active modal
  const getModalWidth = () => {
    if (activeModal === "image") return "max-w-2xl";
    if (activeModal === "quantity") return "max-w-md";
    if (activeModal === "data") return "max-w-3xl";
    if (activeModal === "details") return "max-w-3xl";
    return "max-w-md";
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div
        className={`border border-gray-300 shadow-xl py-4 px-4 md:px-6 rounded-lg bg-white w-full ${getModalWidth()} max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b">
          <button
            onClick={handleBackToMain}
            className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm"
          >
            ← Back
          </button>
          <h2 className="text-lg font-bold text-gray-800">
            {activeModal === "image" && "Edit Image"}
            {activeModal === "quantity" && "Edit Quantity"}
            {activeModal === "data" && "Edit Data"}
            {activeModal === "details" && "Menu Details"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {/* Edit Image Modal */}
        {activeModal === "image" && (
          <div className="space-y-4">
            <div className="relative w-full h-48 md:h-64 border-2 border-gray-200 rounded-lg mb-2 flex items-center justify-center overflow-hidden bg-gray-50">
              {image ? (
                <>
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Dish"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                    aria-label="Remove Image"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  {menu.stockImagesUrl && menu.stockImagesUrl[0]?.url ? (
                    <img
                      src={menu.stockImagesUrl[0].url}
                      alt="Dish"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={defaultMenu}
                      alt="Dish"
                      className="w-full h-full object-cover"
                    />
                  )}
                </>
              )}
            </div>
            <input
              type="file"
              id="file-upload"
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <div className="flex items-center justify-between border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 bg-gray-50 hover:border-primary transition-colors">
              <p className="font-medium text-gray-700 text-sm">
                Upload Dish Image
              </p>
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-white bg-primary text-sm rounded-lg px-4 py-2 text-center hover:bg-primary/90 transition-colors font-medium"
              >
                Choose File
              </label>
            </div>
            {imageError && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-red-600 text-sm">{imageError}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleBackToMain}
                disabled={imageLoading}
                className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditImage}
                disabled={imageLoading || !image}
                className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {imageLoading ? "Updating..." : "Update Image"}
              </button>
            </div>
          </div>
        )}

        {/* Edit Quantity Modal */}
        {activeModal === "quantity" && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="requireCooking"
                  checked={requireCooking}
                  onChange={(e) => setRequireCooking(e.target.checked)}
                  className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label
                  htmlFor="requireCooking"
                  className="text-sm font-semibold text-gray-700"
                >
                  Requires Preparation
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-7">
                Check this if the item needs to be prepared/cooked
              </p>
            </div>
            {!requireCooking && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity{" "}
                  <span className="text-gray-500 font-normal text-xs">
                    (Optional)
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    clearErrorOnChange("quantity");
                  }}
                  placeholder="Enter quantity"
                  className="border-2 border-gray-300 rounded-lg p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
            )}
            {quantityError && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-red-600 text-sm">{quantityError}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleBackToMain}
                disabled={quantityLoading}
                className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditQuantity}
                disabled={quantityLoading}
                className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {quantityLoading ? "Updating..." : "Update Quantity"}
              </button>
            </div>
          </div>
        )}

        {/* Edit Data Modal */}
        {activeModal === "data" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => {
                      setNewCategory(e.target.value);
                      clearErrorOnChange("data");
                    }}
                    className="border-2 border-gray-300 rounded-lg p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  >
                    <option value="">Select Category</option>
                    <option value="food">Food</option>
                    <option value="drink">Drink</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div ref={subcategoryInputRef}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subcategory
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={subcategory}
                      onChange={(e) => {
                        setSubcategory(e.target.value);
                        clearErrorOnChange("data");
                      }}
                      onFocus={() => setShowSubcategoryDropdown(true)}
                      placeholder="Type or select subcategory"
                      className="border-2 border-gray-300 rounded-lg p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    />
                    {showSubcategoryDropdown &&
                      existingSubcategories &&
                      existingSubcategories.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          <div className="p-2">
                            <p className="text-xs text-gray-500 mb-2 font-semibold">
                              Existing Subcategories:
                            </p>
                            {existingSubcategories
                              .filter((subcat) =>
                                subcat
                                  .toLowerCase()
                                  .includes(subcategory.toLowerCase())
                              )
                              .map((subcat, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() =>
                                    handleSubcategorySelect(subcat)
                                  }
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
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type
                  </label>
                  <div className="inline-grid grid-cols-2 rounded-lg border-2 border-gray-300 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setItemType("restaurant")}
                      className={`px-4 py-2 transition-colors text-sm font-medium ${
                        itemType === "restaurant"
                          ? "bg-primary text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Restaurant
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemType("ktv")}
                      className={`px-4 py-2 border-l-2 border-gray-300 transition-colors text-sm font-medium ${
                        itemType === "ktv"
                          ? "bg-primary text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      KTV
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dish Name
                  </label>
                  <input
                    type="text"
                    value={dishName}
                    onChange={(e) => {
                      setDishName(e.target.value);
                      clearErrorOnChange("data");
                    }}
                    placeholder="Enter dish name"
                    className="border-2 border-gray-300 rounded-lg p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={price}
                      onChange={(e) => {
                        setPrice(e.target.value);
                        clearErrorOnChange("data");
                      }}
                      placeholder="Enter price"
                      className="border-2 border-gray-300 rounded-lg p-2.5 w-full pr-16 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-100 border border-gray-300 rounded-md px-3 py-1 text-xs font-medium text-gray-700">
                      MMK
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {dataError && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-red-600 text-sm">{dataError}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleBackToMain}
                disabled={dataLoading}
                className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditData}
                disabled={dataLoading}
                className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {dataLoading ? "Updating..." : "Update Data"}
              </button>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {activeModal === "details" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="w-full">
                <div className="relative w-full h-48 md:h-64 border-2 border-gray-200 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                  {menu.stockImagesUrl && menu.stockImagesUrl[0]?.url ? (
                    <img
                      src={menu.stockImagesUrl[0].url}
                      alt="Dish"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={defaultMenu}
                      alt="Dish"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
              <div className="w-full space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                    Dish Name
                  </label>
                  <p className="text-base font-bold text-gray-900">
                    {menu.name || "N/A"}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                    Price
                  </label>
                  <p className="text-lg font-bold text-primary">
                    {menu.price ? `${menu.price.toLocaleString()} MMK` : "N/A"}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                    Category
                  </label>
                  <p className="text-sm text-gray-900 capitalize font-medium">
                    {menu.category || "N/A"}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                    Subcategory
                  </label>
                  <p className="text-sm text-gray-900 font-medium">
                    {menu.subCategory || "N/A"}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                    Type
                  </label>
                  <p className="text-sm text-gray-900 capitalize font-medium">
                    {menu.type || "N/A"}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                    Requires Preparation
                  </label>
                  <p className="text-sm">
                    {menu.requiresPreparation ? (
                      <span className="text-green-600 font-bold">Yes</span>
                    ) : (
                      <span className="text-gray-600 font-medium">No</span>
                    )}
                  </p>
                </div>

                {!menu.requiresPreparation && menu.quantity !== undefined && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                      Quantity
                    </label>
                    <p className="text-sm text-gray-900 font-medium">
                      {menu.quantity !== null && menu.quantity !== undefined
                        ? menu.quantity
                        : "N/A"}
                    </p>
                  </div>
                )}

                {menu.createdAt && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                      Created At
                    </label>
                    <p className="text-xs text-gray-600">
                      {new Date(menu.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {menu.updatedAt && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                      Last Updated
                    </label>
                    <p className="text-xs text-gray-600">
                      {new Date(menu.updatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleBackToMain}
                className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

EditMenuModel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  menu: PropTypes.object.isRequired,
  refreshMenu: PropTypes.func,
};

export default EditMenuModel;
