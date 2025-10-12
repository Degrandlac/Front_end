import React from "react";

const DialPad = ({ onPress, onDelete }) => {
  const digits = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"]
  ];

  return (
    <div className="mt-4">
      <div className="grid grid-cols-3 gap-2">
        {digits.flat().map((digit) => (
          <button
            key={digit}
            onClick={() => onPress(digit)}
            className="bg-gray-700 text-white py-4 rounded hover:bg-gray-600"
          >
            {digit}
          </button>
        ))}
      </div>

      {/* Delete button */}
      <button
        onClick={onDelete}
        className="mt-4 w-full bg-red-600 text-white py-3 rounded hover:bg-red-800"
      >
        Delete
      </button>
    </div>
  );
};

export default DialPad;
