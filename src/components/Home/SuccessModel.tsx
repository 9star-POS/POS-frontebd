import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

function SuccessModel({ isOpen, onClose }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAnimate(true);
      const timer = setTimeout(() => {
        setAnimate(false);
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex pb-[200px] md:pb-0 items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg p-8 shadow-xl"
      >
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 relative">
            <motion.svg
              viewBox="0 0 50 50"
              className="w-full h-full"
              initial="hidden"
              animate="visible"
            >
              <motion.circle
                cx="25"
                cy="25"
                r="20"
                stroke="#FF6F00"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
              <motion.path
                d="M14 26l8 8 16-16"
                fill="none"
                stroke="#FF6F00"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.5, ease: "easeInOut" }}
              />
            </motion.svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">Your order has been confirmed.</p>
          <button
            onClick={onClose}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-prilight transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default SuccessModel;
