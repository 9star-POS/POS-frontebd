const LoadingSpinner = () => {
  return (
    <div className="flex w-screen bg-white justify-center items-center h-screen">
      <div className="loader border-8 border-t-8 border-gray-200 border-t-black rounded-full w-16 h-16 animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;
