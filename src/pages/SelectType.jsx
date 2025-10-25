import { useNavigate } from "react-router-dom";

export default function SelectType() {
  const navigate = useNavigate();

  const chooseType = (type) => {
    navigate("/restaurant");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <h1 className="text-center text-2xl md:text-3xl font-bold text-primary mb-8">
          Choose Your Mode
        </h1>
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => chooseType("restaurant")}
            className="w-full h-40 md:h-48 bg-white border border-primary text-primary rounded-2xl text-2xl font-semibold hover:bg-primary hover:text-white transition-colors"
          >
            Restaurant
          </button>
        </div>
      </div>
    </div>
  );
}
