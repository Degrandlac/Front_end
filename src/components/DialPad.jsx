import React from "react";

const DialPad = ({ onPress, onDelete }) => {
  const digits = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"]
  ];

  return (
    <div className="mt-6">
      <div className="grid grid-cols-3 gap-4">
        {digits.flat().map((digit) => (
          <button
            key={digit}
            onClick={() => onPress(digit)}
            className="bg-gray-700 text-white py-6 text-2xl font-bold rounded-lg hover:bg-gray-600 shadow-md"
          >
            {digit}
          </button>
        ))}
      </div>

      {/* Delete button */}
      <button
        onClick={onDelete}
        className="mt-6 w-full bg-red-600 text-white py-4 text-xl font-bold rounded-lg hover:bg-red-800 shadow-md"
      >
        Delete
      </button>
    </div>
  );
};

export default DialPad;
