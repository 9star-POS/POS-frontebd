import { useState } from "react";
import { useNavigate } from "react-router-dom";

function EnterID() {
  const navigate = useNavigate();
  const [id, setId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/login/${id}`);
  };

  return (
    <div className="flex w-full justify-center items-center h-screen">
      <div className="w-auto md:w-[450px] bg-white shadow-md rounded-lg p-6 border border-gray-100">
        <h2 className="sub-header font-bold mb-4">Pls Enter Your ID</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Enter your email or username"
              required
              className="block w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary mt-5 text-white font-bold py-4 rounded hover:bg-blue-600 transition duration-200"
          >
            Login BIZ BOZZ
          </button>
        </form>
      </div>
    </div>
  );
}

export default EnterID;
