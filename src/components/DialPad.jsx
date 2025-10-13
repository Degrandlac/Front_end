import React from "react";

const digits = [
  ["1","2","3"],
  ["4","5","6"],
  ["7","8","9"],
  ["*","0","#"]
];

export default function DialPad({ onPress, onDelete }) {
  return (
    <div className="grid grid-cols-3 gap-4 mt-6">
      {digits.flat().map((digit, index) => (
        <button
          key={digit + index} // unique key
          className="w-20 h-20 bg-gray-800 text-white text-2xl rounded-full hover:bg-green-600"
          onClick={() => onPress(digit)}
        >
          {digit}
        </button>
      ))}

      {/* Delete button */}
      <button
        className="col-span-3 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-800"
        onClick={onDelete}
      >
        Delete
      </button>
    </div>
  );
}
