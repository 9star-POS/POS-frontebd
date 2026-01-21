import { motion } from "framer-motion";

const DeleteModel = ({ isOpen, onClose, submit, text, color }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
      <motion.div className="border border-gray-300 shadow-lg p-8 rounded-md bg-white max-w-sm mx-auto">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex items-center justify-center mb-4"
          >
            <svg
              width="130"
              height="130"
              viewBox="0 0 100 100"
              className={`${color ? "bg-orange-400" : "bg-red-500"} rounded-full p-2`}
            >
              <circle cx="50" cy="50" r="50" fill={color ? color : "red"} />
              <path
                d="M30 30 L70 70 M70 30 L30 70"
                stroke="#fff"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
          <h2 className="text-lg sub-header font-bold py-2">
            {text ? text : "Are you sure you want to delete?"}
          </h2>
          <div className="flex justify-center gap-4 md:gap-10 mt-4">
            <button
              onClick={onClose}
              className="border border-gray-300 rounded-md px-4 py-2 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              className={`border ${color ? "border-orange-500" : "border-red-500"} font-bold rounded-md px-4 py-2 text-white  hover:bg-${color ? "orange-600" : "red-600"} active:scale-95 ${color ? "bg-orange-500" : "bg-red-500"}`}
            >
              Delete
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteModel;
