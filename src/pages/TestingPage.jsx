// src/Scoreboard.js
import { useEffect, useState } from "react";

const Scoreboard = () => {
  const [scorePlayer1, setScorePlayer1] = useState(0);
  const [scorePlayer2, setScorePlayer2] = useState(0);

  const incrementScorePlayer1 = () => {
    setScorePlayer1(scorePlayer1 + 1);
  };

  const incrementScorePlayer2 = () => {
    setScorePlayer2(scorePlayer2 + 1);
  };

  const resetScores = () => {
    setScorePlayer1(0);
    setScorePlayer2(0);
  };

  // Effect to handle keyboard presses
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "1") {
        incrementScorePlayer1();
      } else if (event.key === "2") {
        incrementScorePlayer2();
      }
    };

    // Add event listener for keydown
    window.addEventListener("keydown", handleKeyDown);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [scorePlayer1, scorePlayer2]);

  // Function to determine the background color based on the serving player
  const getBackgroundColor = () => {
    const totalPoints = scorePlayer1 + scorePlayer2;
    if (totalPoints % 4 < 2) {
      return "TSO Serve"; // Player 1 serves
    } else {
      return "HHA Serve"; // Player 2 serves
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen ${getBackgroundColor()}`}
    >
      <h1 className="text-2xl font-bold mb-6">
        <p>{getBackgroundColor()}</p>
      </h1>
      <div className="flex space-x-8">
        <div className="flex flex-col items-center">
          <h2 className={`text-xl ${getBackgroundColor()}`}>TSO</h2>
          <div className="text-[200px] font-bold">{scorePlayer1}</div>
          <button
            onClick={incrementScorePlayer1}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          >
            +1
          </button>
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-xl">HHA</h2>
          <div className="text-[200px] font-bold">{scorePlayer2}</div>
          <button
            onClick={incrementScorePlayer2}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700"
          >
            +1
          </button>
        </div>
      </div>
      <button
        onClick={resetScores}
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
      >
        Reset Scores
      </button>
    </div>
  );
};

export default Scoreboard;
