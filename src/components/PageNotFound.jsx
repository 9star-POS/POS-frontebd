// import React from 'react';
import { Link } from "react-router-dom";

const PageNotFound = () => {
  return (
    <div className="min-h-screen text-center bg-gray-100 flex flex-col justify-center items-center">
      <h1 className="text-6xl font-bold text-red-500">404</h1>
      <p className="text-xl mt-4 text-gray-600">
        Oops! The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="mt-6">
        <button className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600">
          Back to Home
        </button>
      </Link>
    </div>
  );
};

export default PageNotFound;
