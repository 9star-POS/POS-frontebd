// EditMenu.js
import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import axios from "../../api/axios";
import defaultMenu from "./../../assets/defaultMenu.jpg";
import getItems from "../../api/Menu/getItems";
import {
  Image,
  Package,
  Edit3,
  X,
  Eye,
  Plus,
  Minus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const EditMenuModel = ({ isOpen, onClose, menu, refreshMenu }) => {
  // Modal states
  const [activeModal, setActiveModal] = useState(null); // null, 'image', 'quantity', 'data'

  // Image edit state
  const [image, setImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null); // { id, spaceKey }

  // Quantity edit state
  const [quantity, setQuantity] = useState(menu.quantity?.toString() || "");
  const [addQuantity, setAddQuantity] = useState("0"); // Quantity to add
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
      setQuantity(menu.quantity?.toString() || "0");
      setAddQuantity("0");
      setRequireCooking(menu.requiresPreparation || false);
      setDishName(menu.name);
      setPrice(menu.price.toString());
      setItemType(menu.type || "restaurant");
      setNewCategory(menu.category || "");
      setSubcategory(menu.subCategory || "");
      setImageError("");
      setQuantityError("");
      setDataError("");
      setIsDeleteConfirmOpen(false);
      setImageToDelete(null);
      setDeletingImageId(null);
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

  // Open delete confirmation modal
  const handleDeleteImageClick = (imageId, spaceKey) => {
    setImageToDelete({ id: imageId, spaceKey });
    setIsDeleteConfirmOpen(true);
  };

  // Close delete confirmation modal
  const handleCloseDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false);
    setImageToDelete(null);
  };

  // Handle Delete Image (after confirmation)
  const handleDeleteImage = async () => {
    if (!imageToDelete) return;

    setImageError("");
    setDeletingImageId(imageToDelete.id);
    setIsDeleteConfirmOpen(false);

    try {
      const res = await axios.delete(`api/v1/stock-image/${imageToDelete.id}`, {
        data: {
          spaceKey: imageToDelete.spaceKey,
        },
      });

      const data = res?.data;
      if (data?.success) {
        toast.success(data?.message || "Image deleted successfully");
        if (refreshMenu) refreshMenu();
      } else {
        setImageError(data?.message || "Failed to delete image");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      setImageError(error.response?.data?.message || "Failed to delete image");
    } finally {
      setDeletingImageId(null);
      setImageToDelete(null);
    }
  };

  // Handle Edit Image (Add New Image)
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

      const res = await axios.post(`api/v1/stock-image/${menu._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = res?.data;
      if (data?.success) {
        toast.success(data?.message || "Image added successfully");
        setImage(null);
        setImageLoading(false);
        handleClose();
        if (refreshMenu) refreshMenu();
      } else {
        setImageError(data?.message || "Failed to add image");
      }
    } catch (error) {
      console.error("Error adding image:", error);
      setImageError(error.response?.data?.message || "Failed to add image");
    } finally {
      setImageLoading(false);
    }
  };

  // Handle Edit Quantity
  const handleEditQuantity = async () => {
    setQuantityError("");
    setQuantityLoading(true);

    try {
      const quantityChange = Number(addQuantity || 0);

      if (quantityChange === 0) {
        setQuantityError(
          "Please enter a quantity change (positive to add, negative to decrease)"
        );
        setQuantityLoading(false);
        return;
      }

      const currentQty = Number(menu.quantity || 0);
      const newTotal = currentQty + quantityChange;

      if (newTotal < 0) {
        setQuantityError(
          `Cannot decrease quantity below 0. Current: ${currentQty}, Attempted change: ${quantityChange}`
        );
        setQuantityLoading(false);
        return;
      }

      const requestBody = {
        quantityChange: quantityChange,
      };

      const res = await axios.patch(
        `api/v1/stock/quantity/${menu._id}`,
        requestBody
      );

      const data = res?.data;
      if (data?.success) {
        toast.success(data?.message || "Quantity updated successfully");
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

  // Calculate new total quantity
  const currentQuantity = Number(menu.quantity || 0);
  const addQty = Number(addQuantity || 0);
  const newTotalQuantity = currentQuantity + addQty;

  // Increment/Decrement add quantity
  const incrementAddQuantity = () => {
    const current = Number(addQuantity || 0);
    setAddQuantity((current + 1).toString());
    setQuantityError("");
  };

  const decrementAddQuantity = () => {
    const current = Number(addQuantity || 0);
    setAddQuantity((current - 1).toString());
    setQuantityError("");
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
      if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
        setDataError("Please enter a valid price");
        setDataLoading(false);
        return;
      }

      // Build request body
      const requestBody = {
        name: dishName.trim(),
        price: Number(price),
        type: itemType,
        requiresPreparation: requireCooking,
      };

      // Only include quantity if requiresPreparation is false
      if (!requireCooking && quantity && quantity.trim() !== "") {
        const qty = Number(quantity);
        if (!isNaN(qty) && qty >= 0) {
          requestBody.quantity = qty;
        }
      }

      // Include category and subcategory if provided
      const chosenCategory = newCategory && newCategory.trim();
      if (chosenCategory) {
        requestBody.category = chosenCategory;
      }
      if (subcategory && subcategory.trim()) {
        requestBody.subCategory = subcategory.trim();
      }

      const res = await axios.patch(`api/v1/stock/${menu._id}`, requestBody);

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
            {activeModal === "image" && `Edit ${menu.name} Image`}
            {activeModal === "quantity" && `Edit ${menu.name} Quantity`}
            {activeModal === "data" && `Edit ${menu.name} Data`}
            {activeModal === "details" && `Menu Details`}
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
            {/* Existing Images */}
            {menu.stockImagesUrl && menu.stockImagesUrl.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Current Images
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {menu.stockImagesUrl.map((img, index) => (
                    <div
                      key={img._id || index}
                      className="relative group border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                    >
                      <img
                        src={img.url}
                        alt={`Dish ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      <button
                        onClick={() =>
                          handleDeleteImageClick(menu._id, img.spaceKey)
                        }
                        disabled={
                          deletingImageId === menu._id ||
                          deletingImageId === img._id
                        }
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                        aria-label="Delete Image"
                        title="Delete Image"
                      >
                        {deletingImageId === menu._id ||
                        deletingImageId === img._id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Image Preview */}
            {image && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  New Image Preview
                </h3>
                <div className="relative w-full h-48 md:h-64 border-2 border-gray-200 rounded-lg mb-2 flex items-center justify-center overflow-hidden bg-gray-50">
                  <img
                    src={URL.createObjectURL(image)}
                    alt="New Dish"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                    aria-label="Remove Image"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
            <input
              type="file"
              id="file-upload"
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            {/* Upload Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {menu.stockImagesUrl && menu.stockImagesUrl.length > 0
                  ? "Add New Image"
                  : "Upload Image"}
              </h3>
              <div className="flex items-center justify-between border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 bg-gray-50 hover:border-primary transition-colors">
                <p className="font-medium text-gray-700 text-sm">
                  {image
                    ? "Image selected. Click 'Add Image' to save."
                    : "Choose an image to upload"}
                </p>
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-white bg-primary text-sm rounded-lg px-4 py-2 text-center hover:bg-primary/90 transition-colors font-medium"
                >
                  Choose File
                </label>
              </div>
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
                {imageLoading ? "Uploading..." : "Add Image"}
              </button>
            </div>
          </div>
        )}

        {/* Edit Quantity Modal */}
        {activeModal === "quantity" && (
          <div className="space-y-6">
            {/* Current Stock Quantity */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Current Stock Quantity
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-100">
                    <Minus size={20} className="text-gray-400" />
                  </div>
                  <div className="flex-1 text-center py-3 px-4">
                    <span className="text-lg font-semibold text-gray-900">
                      {currentQuantity}
                    </span>
                  </div>
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-100">
                    <Plus size={20} className="text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity Calculation Display */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Quantity Calculation
              </h3>
              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                <span className="text-xl font-bold text-gray-900">
                  {currentQuantity}
                </span>
                <span
                  className={`text-xl font-bold ${
                    Number(addQuantity || 0) >= 0
                      ? "text-gray-600"
                      : "text-red-600"
                  }`}
                >
                  {Number(addQuantity || 0) >= 0 ? "+" : ""}
                </span>
                <div className="flex items-center border-2 border-primary rounded-lg overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={decrementAddQuantity}
                    disabled={quantityLoading}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Decrease quantity"
                  >
                    <Minus size={18} className="text-gray-700" />
                  </button>
                  <input
                    type="number"
                    value={addQuantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || value === "-" || !isNaN(value)) {
                        setAddQuantity(value);
                        clearErrorOnChange("quantity");
                      }
                    }}
                    placeholder="0"
                    className="w-24 px-2 py-2 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={quantityLoading}
                  />
                  <button
                    type="button"
                    onClick={incrementAddQuantity}
                    disabled={quantityLoading}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Increase quantity"
                  >
                    <Plus size={18} className="text-gray-700" />
                  </button>
                </div>
                <span className="text-xl font-bold text-gray-600">=</span>
                <span
                  className={`text-xl font-bold ${
                    newTotalQuantity >= 0 ? "text-primary" : "text-red-600"
                  }`}
                >
                  {newTotalQuantity}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter positive number to add, negative number to decrease
              </p>
            </div>

            {/* Stock Details */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock Name
                </label>
                <div className="border-2 border-gray-300 rounded-lg p-2.5 bg-gray-50">
                  <span className="text-sm text-gray-700">
                    {menu.name || "N/A"}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock Code
                </label>
                <div className="border-2 border-gray-300 rounded-lg p-2.5 bg-gray-50">
                  <span className="text-sm text-gray-700">
                    {menu._id?.slice(-6) || "N/A"}
                  </span>
                </div>
              </div>
            </div> */}

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
                disabled={
                  quantityLoading || addQty === 0 || newTotalQuantity < 0
                }
                className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {quantityLoading ? "Updating..." : "Confirm Quantity"}
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
                      type="number"
                      min="0"
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
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="requireCookingData"
                      checked={requireCooking}
                      onChange={(e) => {
                        setRequireCooking(e.target.checked);
                        if (e.target.checked) {
                          setQuantity("");
                        }
                        clearErrorOnChange("data");
                      }}
                      className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label
                      htmlFor="requireCookingData"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Requires Preparation
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 ml-7">
                    Check this if the item needs to be prepared/cooked
                  </p>
                </div>
                {/* {!requireCooking && (
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
                        clearErrorOnChange("data");
                      }}
                      placeholder="Enter quantity"
                      className="border-2 border-gray-300 rounded-lg p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    />
                  </div>
                )} */}
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

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Delete Image</h3>
              <button
                onClick={handleCloseDeleteConfirm}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete this image? This action cannot
                be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCloseDeleteConfirm}
                disabled={deletingImageId !== null}
                className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteImage}
                disabled={deletingImageId !== null}
                className="bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {deletingImageId !== null ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
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
