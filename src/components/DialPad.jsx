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
        className="mt-6 w-20 h-20 bg-red-600 text-white text-xl font-bold rounded-full hover:bg-red-800 shadow-md flex items-center justify-center"
>
        Delete
      </button>
    </div>
  );
};

export default DialPad;
