const Header = () => {
  return (
    <div className="flex justify-between items-center p-2 bg-gray-100">
      <div className="flex items-center space-x-2">
        <button className="flex items-center justify-center rounded-md border border-gray-300 py-2 px-4">
          <span className="text-primary text-3xl">≡</span>
        </button>
      </div>

      <div className="flex items-center space-x-3">
        <button className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-300">
          <span className="text-orange-500">🔔</span>
        </button>
        <div className="flex flex-col items-end">
          <span className="text-gray-800">Anna</span>
          <span className="text-gray-500 text-sm">Cashier</span>
        </div>
        <button className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-300">
          <span className="text-gray-600">👤</span>
        </button>
      </div>
    </div>
  );
};

export default Header;
