import React, { useState } from "react";
import { API_CONFIG } from "./config";
import DialPad from "./components/DialPad";
import PhoneDisplay from "./components/PhoneDisplay";

function App() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callStatus, setCallStatus] = useState("Idle");
  const [currentPath, setCurrentPath] = useState("");
  const [options, setOptions] = useState([]);
  const [audioSrc, setAudioSrc] = useState("");

  // Start a new call
  const startCall = async () => {
    setCallStatus("Calling...");
    setCurrentPath("");
    setOptions([]);
    setAudioSrc(`${API_CONFIG.IVR}/audio/Welcome_message.wav`);
    setCallStatus("In IVR");
  };

  // Hang up the call
  const hangUp = () => {
    setCallStatus("Call Ended");
    setAudioSrc("");
    setCurrentPath("");
    setOptions([]);
    setPhoneNumber("");
  };

  // Handle number button press
  const handleDial = async (digit) => {
    if (callStatus === "Idle") {
      setPhoneNumber((prev) => prev + digit);
      return;
    }

    if (callStatus === "In IVR") {
      try {
        const formData = new FormData();
        formData.append("option", digit);
        formData.append("current_path", currentPath);

        const res = await fetch(`${API_CONFIG.IVR}/ivr/select`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        setCurrentPath(data.path || "");
        setOptions(data.options || []);
        setAudioSrc(`${API_CONFIG.IVR}/audio/${data.audio}`);

        if (digit === "3") {
          setCallStatus("Agent");
        }
      } catch (err) {
        console.error("IVR error:", err);
      }
    }
  };

  // Delete last digit
  const handleDelete = () => {
    if (callStatus === "Idle") {
      setPhoneNumber((prev) => prev.slice(0, -1));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4">
      <h1 className="text-3xl text-white mb-4">Call Center Simulator</h1>
      <PhoneDisplay number={phoneNumber} status={callStatus} />

      <div className="flex space-x-4 mt-4">
        <button
          onClick={startCall}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-800"
        >
          Call
        </button>
        <button
          onClick={hangUp}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-800"
        >
          Hang Up
        </button>
      </div>

      <DialPad onPress={handleDial} onDelete={handleDelete} />
    </div>
  );
}

export default App;
