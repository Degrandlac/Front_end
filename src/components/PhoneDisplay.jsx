import React from "react";

export default function PhoneDisplay({ number, status }) {
  return (
    <div className="bg-gray-900 text-white p-4 rounded-md text-center">
      <div className="text-xl">Number: {number}</div>
      <div className="text-sm mt-2">{status}</div>
    </div>
  );
}
