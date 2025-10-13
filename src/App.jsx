import React, { useState } from "react";
import { API_CONFIG } from "./config";
import DialPad from "./components/DialPad";
import PhoneDisplay from "./components/PhoneDisplay";
import VoiceRecorder from "./components/VoiceRecorder";

function App() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callStatus, setCallStatus] = useState("Idle");
  const [currentPath, setCurrentPath] = useState("");
  const [options, setOptions] = useState([]);
  const [audioSrc, setAudioSrc] = useState("");
  const [messages, setMessages] = useState([]);

  const startCall = () => {
    if (!/^07\d{8}$/.test(phoneNumber)) {
      alert("Phone number must start with 07 and be 10 digits.");
      return;
    }
    setCallStatus("In IVR");
    setCurrentPath("");
    setOptions([]);
    setAudioSrc(`${API_CONFIG.IVR}/audio/Welcome_message.wav`);
  };

  const hangUp = () => {
    setCallStatus("Idle");
    setCurrentPath("");
    setOptions([]);
    setPhoneNumber("");
    setAudioSrc("");
    setMessages([]);
  };

  const handleDial = async (digit) => {
  // PHONE INPUT MODE
  if (callStatus === "Idle") {
    setPhoneNumber((prev) => {
      if (prev.length >= 10) return prev;                    // max 10 digits
      if (prev.length === 0 && digit !== "0") return prev;  // first must be 0
      if (prev.length === 1 && prev[0] === "0" && digit !== "7") return prev; // second must be 7
      if (!/[0-9]/.test(digit)) return prev;                // only digits
      return prev + digit;
    });
    return; // DO NOT send any request in phone input mode
  }

  // IVR MODE (only after call started)
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

      if (digit === "3") setCallStatus("Agent"); // go to agent mode
    } catch (err) {
      console.error("IVR error:", err);
    }
  }
};


  const handleDelete = () => {
    if (callStatus === "Idle") setPhoneNumber((prev) => prev.slice(0, -1));
  };

  // Agent voice interaction
  const handleAudio = async (blob) => {
    try {
      // 1️⃣ STT
      const formData = new FormData();
      formData.append("file", blob, "voice.webm");
      const sttRes = await fetch(API_CONFIG.STT, { method: "POST", body: formData });
      const sttData = await sttRes.json();
      const userText = sttData.text;

      setMessages((m) => [...m, { sender: "user", text: userText }]);

      // 2️⃣ Chat
      const chatRes = await fetch(API_CONFIG.CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userText, phone_number: phoneNumber }),
      });
      const chatData = await chatRes.json();
      const botText = chatData.response;

      setMessages((m) => [...m, { sender: "bot", text: botText }]);

      // 3️⃣ TTS
      const ttsRes = await fetch(API_CONFIG.TTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: botText }),
      });
      const audioBlob = await ttsRes.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      new Audio(audioUrl).play();
    } catch (err) {
      console.error("Agent interaction error:", err);
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

      {callStatus === "Agent" && (
        <div className="mt-6 w-full max-w-md">
          <h2 className="text-white text-xl mb-2">🎤 Speak to the Agent</h2>
          <VoiceRecorder onAudioReady={handleAudio} />
          <div className="bg-gray-800 rounded-lg p-4 mt-4 max-h-60 overflow-y-auto">
            {messages.map((msg, i) => (
              <p key={i} className={msg.sender === "user" ? "text-blue-400" : "text-green-400"}>
                <strong>{msg.sender === "user" ? "You:" : "Agent:"}</strong> {msg.text}
              </p>
            ))}
          </div>
        </div>
      )}

      {audioSrc && (
        <audio src={audioSrc} autoPlay />
      )}
    </div>
  );
}

export default App;
