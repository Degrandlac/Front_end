import React from "react";

const PhoneDisplay = ({ number, status }) => {
  return (
    <div className="bg-gray-800 text-white p-4 rounded w-full max-w-md text-center">
      <p className="text-lg">Phone: {number || "__________"}</p>
      <p className="text-sm mt-2">Status: {status}</p>
    </div>
  );
};

export default PhoneDisplay;