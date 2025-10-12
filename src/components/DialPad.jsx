import React from "react";

export default function DialPad({ onPress }) {
  const buttons = [
    ["1","2","3"],
    ["4","5","6"],
    ["7","8","9"],
    ["*","0","#"],
  ];

  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {buttons.flat().map((b) => (
        <button
          key={b}
          className="w-20 h-20 bg-gray-800 text-white text-2xl rounded-full hover:bg-green-600"
          onClick={() => onPress(b)}
        >
          {b}
        </button>
      ))}
    </div>
  );
}
