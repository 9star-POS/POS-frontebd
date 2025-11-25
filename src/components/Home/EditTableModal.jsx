import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import updateTableService from "../../api/Table/updateTableService";
import deleteTableService from "../../api/Table/deleteTableService";
import DeleteModel from "../DeleteModel";
import { X, Trash2 } from "lucide-react";

const EditTableModal = ({ isOpen, onClose, table, onSuccess }) => {
  const [tableNumber, setTableNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && table) {
      setTableNumber(table.tableNumber || "");
      setError("");
      setLoading(false);
      setIsDeleteModalOpen(false);
      setIsDeleting(false);
    }
  }, [isOpen, table]);

  if (!isOpen || !table) {
    return null;
  }

  const handleClose = () => {
    if (!loading && !isDeleting) {
      setTableNumber("");
      setError("");
      setIsDeleteModalOpen(false);
      onClose();
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!table?._id) return;
    setIsDeleting(true);
    try {
      const res = await deleteTableService(table._id);
      if (res?.success) {
        setIsDeleteModalOpen(false);
        onClose();
        onSuccess?.();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const trimmedTableNumber = tableNumber.trim();

    if (!trimmedTableNumber) {
      setError("Table number is required.");
      return;
    }

    if (!/^\d+$/.test(trimmedTableNumber)) {
      setError("Table number must contain digits only.");
      return;
    }

    // Check if table number is unchanged
    if (trimmedTableNumber === String(table.tableNumber || "")) {
      setError("Table number is the same as current value.");
      return;
    }

    setLoading(true);
    const response = await updateTableService(table._id, {
      tableNumber: trimmedTableNumber,
    });

    if (response?.success) {
      setLoading(false);
      onSuccess?.(response);
      setTableNumber("");
      onClose();
      return;
    }

    setError(
      response?.message || "Unable to update table. Please try again later."
    );
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-300 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="sub-header">Edit Table</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-500 transition hover:text-gray-700"
            disabled={loading}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="tableNumber"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Table Number
            </label>
            <input
              id="tableNumber"
              name="tableNumber"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={tableNumber}
              onChange={(event) => {
                const { value } = event.target;
                if (/^\d*$/.test(value)) {
                  setTableNumber(value);
                  setError("");
                }
              }}
              placeholder="Enter table number"
              className="w-full rounded-md border-2 border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              disabled={loading}
            />
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            </div>
          )}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={loading || isDeleting}
              className="flex items-center gap-2 rounded-md border border-red-500 px-4 py-2 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 text-sm font-medium"
            >
              <Trash2 size={16} />
              Delete Table
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 text-sm font-medium"
                disabled={loading || isDeleting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md border border-primary bg-primary px-4 py-2 text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 text-sm font-medium"
                disabled={loading || isDeleting}
              >
                {loading ? "Updating..." : "Update Table"}
              </button>
            </div>
          </div>
        </form>
      </div>
      <DeleteModel
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        submit={handleConfirmDelete}
        text={
          table
            ? `Delete table ${table.tableNumber}? This action cannot be undone.`
            : "Delete this table?"
        }
      />
    </div>
  );
};

EditTableModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  table: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default EditTableModal;

