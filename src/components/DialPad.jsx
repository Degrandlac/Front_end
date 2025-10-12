import React from "react";

const DialPad = ({ onPress, onDelete }) => {
  const digits = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"]
  ];

  return (
    <div className="mt-8">
      <div className="grid grid-cols-3 gap-4 max-w-xs">
        {digits.flat().map((body) => (
          <button
            key={b}
            className="w-20 h-20 bg-gray-800 text-white text-2xl rounded-full hover:bg-green-600"
            onClick={() => onPress(b)}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Delete button */}
      <button
        onClick={onDelete}
        className="mt-6 w-20 h-20 bg-red-600 text-white text-xl font-bold rounded-full hover:bg-red-800 shadow-md flex items-center justify-center"
>
        Delete
      </button>
    </div>
  );
};

export default DialPad;
