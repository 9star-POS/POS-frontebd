import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import createTable from "../../api/Table/createTable";

const CreateTableModal = ({ isOpen, onClose, onSuccess }) => {
  const [tableNumber, setTableNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTableNumber("");
      setError("");
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    if (!loading) {
      onClose();
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

    setLoading(true);
    const response = await createTable({ tableNumber: trimmedTableNumber });
    // console.log("response", response);

    if (response.success) {
      setLoading(false);
      onSuccess?.(response);
      setTableNumber("");
      onClose();
      return;
    }

    setError(
      response?.message || "Unable to create table. Please try again later."
    );
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="sub-header">Create Table</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-500 transition hover:text-gray-700"
            disabled={loading}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="tableNumber"
              className="block text-sm font-medium text-gray-700"
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
                }
              }}
              placeholder="Enter table number"
              className="mt-1 w-full rounded-md border border-primary px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="w-28 rounded-md border border-primary px-4 py-2 text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-36 rounded-md border border-primary bg-primary px-4 py-2 text-white transition hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Table"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateTableModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

export default CreateTableModal;
