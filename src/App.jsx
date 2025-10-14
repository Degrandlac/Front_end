// import React, { useState, useRef } from "react";
// import { API_CONFIG } from "./config";
// import DialPad from "./components/DialPad";
// import PhoneDisplay from "./components/PhoneDisplay";
// import VoiceRecorder from "./components/VoiceRecorder";

// function App() {
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [callStatus, setCallStatus] = useState("Idle");
//   const [currentPath, setCurrentPath] = useState("");
//   const [options, setOptions] = useState([]);
//   const [audioSrc, setAudioSrc] = useState("");
//   const [messages, setMessages] = useState([]);
  
//   const currentAudioRef = useRef(null);
//   const agentConnectionRef = useRef(null);

//   // Stop all currently playing audio
//   const stopAllAudio = () => {
//     if (currentAudioRef.current) {
//       currentAudioRef.current.pause();
//       currentAudioRef.current.currentTime = 0;
//       currentAudioRef.current = null;
//     }
//     setAudioSrc("");
//   };

//   // Play audio and track element
//   const playAudio = (src) => {
//     stopAllAudio();
//     setAudioSrc(src);
//   };

//   // 📞 Start IVR Call
//   const startCall = () => {
//     if (!/^07\d{8}$/.test(phoneNumber)) {
//       alert("Phone number must start with 07 and be 10 digits.");
//       return;
//     }
//     setCallStatus("In IVR");
//     setCurrentPath("");
//     setOptions([]);

//     // ✅ FIXED: Use backend route for welcome audio
//     playAudio(`${API_CONFIG.IVR}/ivr/select/audio/Welcome_message.wav`);
//   };

//   // 🔚 Hang up call
//   const hangUp = () => {
//     stopAllAudio();
//     if (agentConnectionRef.current) {
//       agentConnectionRef.current.abort();
//       agentConnectionRef.current = null;
//     }
//     setCallStatus("Idle");
//     setCurrentPath("");
//     setOptions([]);
//     setPhoneNumber("");
//     setMessages([]);
//   };

//   // ☎️ Dialpad handler
//   const handleDial = async (digit) => {
//     if (callStatus === "Idle") {
//       setPhoneNumber((prev) => {
//         if (prev.length >= 10) return prev;
//         if (prev.length === 0 && digit !== "0") return prev;
//         if (prev.length === 1 && prev[0] === "0" && digit !== "7") return prev;
//         if (!/[0-9]/.test(digit)) return prev;
//         return prev + digit;
//       });
//       return;
//     }

//     if (callStatus === "In IVR") {
//       try {
//         const res = await fetch(`${API_CONFIG.IVR}/ivr/select`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ option: digit, current_path: currentPath }),
//         });

//         const data = await res.json();
//         console.log("IVR Response:", data);

//         if (!data.audio) {
//           alert("No audio found for this option");
//           return;
//         }

//         setCurrentPath(data.path || "");
//         setOptions(data.options || []);

//         // ✅ FIXED: Use backend IVR audio route
//         // Previously used `/audio/${data.audio}` which caused 404
//         playAudio(`${API_CONFIG.IVR}/ivr/select/audio/${data.audio}`);

//         // ✅ FIXED: Agent transfer handling (option 3 or 2.1)
//         if (data.connect_to_agent || digit === "3" || (currentPath === "2" && digit === "1")) {
//           setTimeout(() => {
//             setCallStatus("Agent");
//             if (data.waiting) {
//               // ✅ FIXED: Use correct backend route for waiting audio
//               playAudio(`${API_CONFIG.IVR}/ivr/select/audio/${data.waiting}`);
//             }
//           }, 2000);
//         }
//       } catch (err) {
//         console.error("IVR error:", err);
//         alert("Failed to process IVR selection");
//       }
//     }
//   };

//   const handleDelete = () => {
//     if (callStatus === "Idle") setPhoneNumber((prev) => prev.slice(0, -1));
//   };

//   // 🎤 Handle audio for STT → Chat → TTS
//   const handleAudio = async (blob) => {
//   const abortController = new AbortController();
//   agentConnectionRef.current = abortController;

//   let waitingAudio = null;
//   let waitingInterval = null;

//   try {
//     // ✅ Create the waiting audio element
//     waitingAudio = new Audio(`${API_CONFIG.IVR}/ivr/select/audio/waiting.wav`);

//     // ✅ Function to play waiting audio every 5 seconds
//     const playWaitingAudio = () => {
//       waitingAudio.currentTime = 0;
//       waitingAudio.play().catch((e) => console.log("Waiting audio error:", e));
//     };

//     // Play immediately and then repeat every 5 sec
//     playWaitingAudio();
//     waitingInterval = setInterval(playWaitingAudio, 5000);

//     // 1️⃣ STT
//     const formData = new FormData();
//     formData.append("file", blob, "voice.webm");

//     const sttRes = await fetch(API_CONFIG.STT, { 
//       method: "POST", 
//       body: formData,
//       signal: abortController.signal
//     });

//     if (!sttRes.ok) throw new Error(`STT failed (${sttRes.status})`);
//     const sttData = await sttRes.json();
//     const userText = sttData.text || "";
//     setMessages((m) => [...m, { sender: "user", text: userText }]);

//     // 2️⃣ Chat
//     const chatRes = await fetch(API_CONFIG.CHAT, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ text: userText, phone_number: phoneNumber }),
//       signal: abortController.signal
//     });

//     if (!chatRes.ok) throw new Error(`Chat failed (${chatRes.status})`);
//     const chatData = await chatRes.json();
//     const botText = chatData.response || "";
//     setMessages((m) => [...m, { sender: "bot", text: botText }]);

//     // ✅ Stop waiting audio loop
//     clearInterval(waitingInterval);
//     waitingAudio.pause();
//     waitingAudio.currentTime = 0;

//     // 3️⃣ TTS
//     const ttsRes = await fetch(API_CONFIG.TTS, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ text: botText }),
//       signal: abortController.signal
//     });

//     if (!ttsRes.ok) throw new Error(`TTS failed (${ttsRes.status})`);
//     const audioBlob = await ttsRes.blob();

//     const audioUrl = URL.createObjectURL(audioBlob);
//     const audio = new Audio(audioUrl);
//     currentAudioRef.current = audio;
//     audio.play();

//     agentConnectionRef.current = null;

//   } catch (err) {
//     if (err.name === 'AbortError') {
//       console.log("⚠️ Agent connection aborted by user");
//       return;
//     }
//     console.error("❌ AUDIO HANDLING ERROR:", err);
//     alert(`Error: ${err.message}`);

//     if (waitingInterval) clearInterval(waitingInterval);
//     if (waitingAudio) {
//       waitingAudio.pause();
//       waitingAudio.currentTime = 0;
//     }
//   }
// };

//   // const handleAudio = async (blob) => {
//   //   const abortController = new AbortController();
//   //   agentConnectionRef.current = abortController;

//   //   let waitingAudio = null;

//   //   try {
//   //     // ✅ FIXED: Correct waiting audio route
//   //     waitingAudio = new Audio(`${API_CONFIG.IVR}/ivr/select/audio/waiting.wav`);
//   //     currentAudioRef.current = waitingAudio;
//   //     waitingAudio.play().catch((e) => console.log("Waiting audio error:", e));

//   //     const formData = new FormData();
//   //     formData.append("file", blob, "voice.webm");

//   //     // 1️⃣ STT
//   //     const sttRes = await fetch(API_CONFIG.STT, { 
//   //       method: "POST", 
//   //       body: formData,
//   //       signal: abortController.signal
//   //     });

//   //     if (!sttRes.ok) throw new Error(`STT failed (${sttRes.status})`);
//   //     const sttData = await sttRes.json();
//   //     const userText = sttData.text || "";
//   //     setMessages((m) => [...m, { sender: "user", text: userText }]);

//   //     // 2️⃣ Chat
//   //     const chatRes = await fetch(API_CONFIG.CHAT, {
//   //       method: "POST",
//   //       headers: { "Content-Type": "application/json" },
//   //       body: JSON.stringify({ text: userText, phone_number: phoneNumber }),
//   //       signal: abortController.signal
//   //     });

//   //     if (!chatRes.ok) throw new Error(`Chat failed (${chatRes.status})`);
//   //     const chatData = await chatRes.json();
//   //     const botText = chatData.response || "";

//   //     if (waitingAudio) {
//   //       waitingAudio.pause();
//   //       waitingAudio.currentTime = 0;
//   //     }

//   //     setMessages((m) => [...m, { sender: "bot", text: botText }]);

//   //     // 3️⃣ TTS
//   //     const ttsRes = await fetch(API_CONFIG.TTS, {
//   //       method: "POST",
//   //       headers: { "Content-Type": "application/json" },
//   //       body: JSON.stringify({ text: botText }),
//   //       signal: abortController.signal
//   //     });

//   //     if (!ttsRes.ok) throw new Error(`TTS failed (${ttsRes.status})`);
//   //     const audioBlob = await ttsRes.blob();

//   //     const audioUrl = URL.createObjectURL(audioBlob);
//   //     const audio = new Audio(audioUrl);
//   //     currentAudioRef.current = audio;
//   //     audio.play();

//   //     agentConnectionRef.current = null;
//   //   } catch (err) {
//   //     if (err.name === 'AbortError') {
//   //       console.log("⚠️ Agent connection aborted by user");
//   //       return;
//   //     }
//   //     console.error("❌ AUDIO HANDLING ERROR:", err);
//   //     alert(`Error: ${err.message}`);
//   //     if (waitingAudio) {
//   //       waitingAudio.pause();
//   //       waitingAudio.currentTime = 0;
//   //     }
//   //   }
//   // };

//   const handleAudioElement = (element) => {
//     if (element) currentAudioRef.current = element;
//   };

//   return (
//     <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4">
//       <h1 className="text-3xl text-white mb-4">Call Center Simulator</h1>
//       <PhoneDisplay number={phoneNumber} status={callStatus} />

//       <div className="flex space-x-4 mt-4">
//         <button onClick={startCall} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-800">
//           Call
//         </button>
//         <button onClick={hangUp} className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-800">
//           Hang Up
//         </button>
//       </div>

//       <DialPad onPress={handleDial} onDelete={handleDelete} />

//       {callStatus === "In IVR" && options.length > 0 && (
//         <div className="mt-4 p-4 bg-gray-800 rounded-lg">
//           <p className="text-white text-sm mb-2">Available options:</p>
//           <div className="flex gap-2 flex-wrap">
//             {options.map((opt) => (
//               <span key={opt} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
//                 {opt === "9" ? "9 (Return)" : opt}
//               </span>
//             ))}
//           </div>
//         </div>
//       )}

//       {callStatus === "Agent" && (
//         <div className="mt-6 w-full max-w-md">
//           <h2 className="text-white text-xl mb-2">🎤 Speak to the Agent</h2>
//           <VoiceRecorder onAudioReady={handleAudio} />
//           <div className="bg-gray-800 rounded-lg p-4 mt-4 max-h-60 overflow-y-auto">
//             {messages.map((msg, i) => (
//               <p key={i} className={msg.sender === "user" ? "text-blue-400" : "text-green-400"}>
//                 <strong>{msg.sender === "user" ? "You:" : "Agent:"}</strong> {msg.text}
//               </p>
//             ))}
//           </div>
//         </div>
//       )}

//       {audioSrc && <audio src={audioSrc} autoPlay ref={handleAudioElement} />}
//     </div>
//   );
// }

// export default App;


// const handleAudio = async (blob) => {
//   const abortController = new AbortController();
//   agentConnectionRef.current = abortController;

//   let waitingAudio = null;
//   let waitingInterval = null;

//   try {
//     // ✅ Create the waiting audio element
//     waitingAudio = new Audio(`${API_CONFIG.IVR}/ivr/select/audio/waiting.wav`);

//     // ✅ Function to play waiting audio every 5 seconds
//     const playWaitingAudio = () => {
//       waitingAudio.currentTime = 0;
//       waitingAudio.play().catch((e) => console.log("Waiting audio error:", e));
//     };

//     // Play immediately and then repeat every 5 sec
//     playWaitingAudio();
//     waitingInterval = setInterval(playWaitingAudio, 5000);

//     // 1️⃣ STT
//     const formData = new FormData();
//     formData.append("file", blob, "voice.webm");

//     const sttRes = await fetch(API_CONFIG.STT, { 
//       method: "POST", 
//       body: formData,
//       signal: abortController.signal
//     });

//     if (!sttRes.ok) throw new Error(`STT failed (${sttRes.status})`);
//     const sttData = await sttRes.json();
//     const userText = sttData.text || "";
//     setMessages((m) => [...m, { sender: "user", text: userText }]);

//     // 2️⃣ Chat
//     const chatRes = await fetch(API_CONFIG.CHAT, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ text: userText, phone_number: phoneNumber }),
//       signal: abortController.signal
//     });

//     if (!chatRes.ok) throw new Error(`Chat failed (${chatRes.status})`);
//     const chatData = await chatRes.json();
//     const botText = chatData.response || "";
//     setMessages((m) => [...m, { sender: "bot", text: botText }]);

//     // ✅ Stop waiting audio loop
//     clearInterval(waitingInterval);
//     waitingAudio.pause();
//     waitingAudio.currentTime = 0;

//     // 3️⃣ TTS
//     const ttsRes = await fetch(API_CONFIG.TTS, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ text: botText }),
//       signal: abortController.signal
//     });

//     if (!ttsRes.ok) throw new Error(`TTS failed (${ttsRes.status})`);
//     const audioBlob = await ttsRes.blob();

//     const audioUrl = URL.createObjectURL(audioBlob);
//     const audio = new Audio(audioUrl);
//     currentAudioRef.current = audio;
//     audio.play();

//     agentConnectionRef.current = null;

//   } catch (err) {
//     if (err.name === 'AbortError') {
//       console.log("⚠️ Agent connection aborted by user");
//       return;
//     }
//     console.error("❌ AUDIO HANDLING ERROR:", err);
//     alert(`Error: ${err.message}`);

//     if (waitingInterval) clearInterval(waitingInterval);
//     if (waitingAudio) {
//       waitingAudio.pause();
//       waitingAudio.currentTime = 0;
//     }
//   }
// };

import React, { useState, useRef } from "react";
import { API_CONFIG } from "./config";
import DialPad from "./components/DialPad";
import PhoneDisplay from "./components/PhoneDisplay";
import VoiceRecorder from "./components/VoiceRecorder";

function App() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callStatus, setCallStatus] = useState("Idle");
  const [currentPath, setCurrentPath] = useState("");
  const [options, setOptions] = useState([]);
  const [messages, setMessages] = useState([]);

  const currentAudioRef = useRef(null);
  const agentConnectionRef = useRef(null);

  // Stop all audio
  const stopAllAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
  };

  // Play audio and track element
  const playAudio = (src, onEnded = null) => {
    stopAllAudio();
    const audio = new Audio(src);
    currentAudioRef.current = audio;
    if (onEnded) audio.onended = onEnded;
    audio.play().catch((e) => console.log("Audio play error:", e));
  };

  // Start call
  const startCall = () => {
    if (!/^07\d{8}$/.test(phoneNumber)) {
      alert("Phone number must start with 07 and be 10 digits.");
      return;
    }
    setCallStatus("In IVR");
    setCurrentPath("");
    setOptions([]);
    playAudio(`${API_CONFIG.IVR}/ivr/select/audio/Welcome_message.wav`);
  };

  // Hang up
  const hangUp = () => {
    stopAllAudio();
    if (agentConnectionRef.current) {
      agentConnectionRef.current.abort();
      agentConnectionRef.current = null;
    }
    setCallStatus("Idle");
    setCurrentPath("");
    setOptions([]);
    setPhoneNumber("");
    setMessages([]);
  };

  // Handle dialpad input
  const handleDial = async (digit) => {
    if (callStatus === "Idle") {
      // Phone number input
      setPhoneNumber((prev) => {
        if (prev.length >= 10) return prev;
        if (prev.length === 0 && digit !== "0") return prev;
        if (prev.length === 1 && prev[0] === "0" && digit !== "7") return prev;
        if (!/[0-9]/.test(digit)) return prev;
        return prev + digit;
      });
      return;
    }

    if (callStatus === "In IVR") {
      // Handle Return option
      if (digit === "0") {
        // Return to previous menu
        setCurrentPath(""); // Reset path or implement previous menu logic
        playAudio(`${API_CONFIG.IVR}/ivr/select/audio/Welcome_message.wav`);
        return;
      }

      try {
        const res = await fetch(`${API_CONFIG.IVR}/ivr/select`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ option: digit, current_path: currentPath }),
        });
        const data = await res.json();
        setCurrentPath(data.path || "");
        setOptions(data.options || []);

        // Play option audio
        const onOptionEnded = () => {
          // After option audio ends, play return option if option 1
          if (digit === "1") {
            playAudio(`${API_CONFIG.IVR}/ivr/select/audio/return.wav`);
          }
        };

        playAudio(`${API_CONFIG.IVR}/ivr/select/audio/${data.audio}`, onOptionEnded);

        // Agent transfer
        if (data.connect_to_agent || digit === "3" || (currentPath === "2" && digit === "1")) {
          setTimeout(() => {
            setCallStatus("Agent");
          }, 2000);
        }
      } catch (err) {
        console.error("IVR error:", err);
        alert("Failed to process IVR selection");
      }
    }
  };

  const handleDelete = () => {
    if (callStatus === "Idle") setPhoneNumber((prev) => prev.slice(0, -1));
  };

  // Handle voice recording (STT → Chat → TTS)
  const handleAudio = async (blob) => {
    const abortController = new AbortController();
    agentConnectionRef.current = abortController;

    let waitingAudio = new Audio(`${API_CONFIG.IVR}/ivr/select/audio/waiting.wav`);
    let waitingInterval = null;

    try {
      // Play waiting audio every 5 sec while processing
      const playWaiting = () => {
        waitingAudio.currentTime = 0;
        waitingAudio.play().catch(() => {});
      };
      playWaiting();
      waitingInterval = setInterval(playWaiting, 5000);

      // STT
      const formData = new FormData();
      formData.append("file", blob, "voice.webm");
      const sttRes = await fetch(API_CONFIG.STT, { method: "POST", body: formData, signal: abortController.signal });
      const sttData = await sttRes.json();
      const userText = sttData.text || "";
      setMessages((m) => [...m, { sender: "user", text: userText }]);

      // Chat
      const chatRes = await fetch(API_CONFIG.CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userText, phone_number: phoneNumber }),
        signal: abortController.signal,
      });
      const chatData = await chatRes.json();
      const botText = chatData.response || "";
      setMessages((m) => [...m, { sender: "bot", text: botText }]);

      // Stop waiting audio
      clearInterval(waitingInterval);
      waitingAudio.pause();
      waitingAudio.currentTime = 0;

      // TTS
      const ttsRes = await fetch(API_CONFIG.TTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: botText }),
        signal: abortController.signal,
      });
      const audioBlob = await ttsRes.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      audio.play();

      agentConnectionRef.current = null;
    } catch (err) {
      console.error(err);
      clearInterval(waitingInterval);
      waitingAudio.pause();
      waitingAudio.currentTime = 0;
    }
  };

  const handleAudioElement = (element) => {
    if (element) currentAudioRef.current = element;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4">
      <h1 className="text-3xl text-white mb-4">Call Center Simulator</h1>
      <PhoneDisplay number={phoneNumber} status={callStatus} />

      <div className="flex space-x-4 mt-4">
        <button onClick={startCall} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-800">
          Call
        </button>
        <button onClick={hangUp} className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-800">
          Hang Up
        </button>
      </div>

      <DialPad onPress={handleDial} onDelete={handleDelete} />

      {callStatus === "In IVR" && options.length > 0 && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
          <p className="text-white text-sm mb-2">Available options:</p>
          <div className="flex gap-2 flex-wrap">
            {options.map((opt) => (
              <span key={opt} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                {opt === "9" ? "9 (Return)" : opt}
              </span>
            ))}
          </div>
        </div>
      )}

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
    </div>
  );
}

export default App;
