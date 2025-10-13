// import React, { useState } from "react";

// const VoiceRecorder = ({ onAudioReady }) => {
//   const [recording, setRecording] = useState(false);
//   const [mediaRecorder, setMediaRecorder] = useState(null);

//   const startRecording = async () => {
//     if (recording) return;
//     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     const recorder = new MediaRecorder(stream);
//     const chunks = [];

//     recorder.ondataavailable = (e) => chunks.push(e.data);
//     recorder.onstop = () => {
//       const blob = new Blob(chunks, { type: "audio/webm" });
//       onAudioReady(blob);
//     };

//     recorder.start();
//     setMediaRecorder(recorder);
//     setRecording(true);

//     // Stop after 10s automatically
//     setTimeout(() => stopRecording(recorder), 10000);
//   };

//   const stopRecording = (recorder = mediaRecorder) => {
//     if (!recording) return;
//     recorder.stop();
//     setRecording(false);
//   };

//   return (
//     <div className="flex space-x-4">
//       <button
//         onClick={startRecording}
//         className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800"
//       >
//         {recording ? "Recording..." : "Start 10s Recording"}
//       </button>
//     </div>
//   );
// };

// export default VoiceRecorder;



// import React, { useState, useRef } from "react";

// const VoiceRecorder = ({ onAudioReady }) => {
//   const [recording, setRecording] = useState(false);
//   const mediaRecorderRef = useRef(null);
//   const streamRef = useRef(null);
//   const chunksRef = useRef([]);
//   const timeoutRef = useRef(null);

//   const startRecording = async () => {
//     if (recording) return;

//     try {
//       // Request microphone access
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       streamRef.current = stream;

//       // Create MediaRecorder
//       const recorder = new MediaRecorder(stream, {
//       mimeType: 'audio/wav'  // ← Try WAV instead
//     });

//       // Collect audio data
//       recorder.ondataavailable = (e) => {
//         if (e.data.size > 0) {
//           chunksRef.current.push(e.data);
//         }
//       };

//       // Handle recording stop
//       recorder.onstop = () => {
//         const blob = new Blob(chunksRef.current, { type: "audio/webm" });
//         onAudioReady(blob);
        
//         // Clean up media stream
//         if (streamRef.current) {
//           streamRef.current.getTracks().forEach(track => track.stop());
//           streamRef.current = null;
//         }
//       };

//       // Start recording
//       recorder.start();
//       setRecording(true);

//       // Auto-stop after 10 seconds
//       timeoutRef.current = setTimeout(() => {
//         stopRecording();
//       }, 10000);

//     } catch (err) {
//       console.error("Microphone access error:", err);
//       alert("Could not access microphone. Please check permissions.");
//     }
//   };

//   const stopRecording = () => {
//     if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
//       return;
//     }

//     // Clear timeout if manually stopped
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current);
//       timeoutRef.current = null;
//     }

//     // Stop recording
//     mediaRecorderRef.current.stop();
//     setRecording(false);
//   };

//   return (
//     <div className="flex space-x-4">
//       <button
//         onClick={recording ? stopRecording : startRecording}
//         className={`${
//           recording ? "bg-red-600 hover:bg-red-800" : "bg-blue-600 hover:bg-blue-800"
//         } text-white px-4 py-2 rounded transition-colors`}
//       >
//         {recording ? "⏹ Stop Recording" : "🎤 Start Recording (10s max)"}
//       </button>
//     </div>
//   );
// };

// export default VoiceRecorder;


import React, { useState, useRef } from "react";

const VoiceRecorder = ({ onAudioReady }) => {
  const [recording, setRecording] = useState(false);
  const [converting, setConverting] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timeoutRef = useRef(null);
  const audioContextRef = useRef(null);

  // Convert WebM blob to WAV format
  const convertToWav = async (webmBlob) => {
    setConverting(true);
    try {
      const arrayBuffer = await webmBlob.arrayBuffer();
      
      // Create audio context if not exists
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to WAV format
      const wavBlob = await audioBufferToWav(audioBuffer);
      setConverting(false);
      return wavBlob;
      
    } catch (err) {
      console.error("WAV conversion error:", err);
      setConverting(false);
      throw err;
    }
  };

  // Convert AudioBuffer to WAV blob
  const audioBufferToWav = (audioBuffer) => {
    const numberOfChannels = 1; // Mono
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    // Get audio data (convert to mono if stereo)
    let audioData;
    if (audioBuffer.numberOfChannels === 2) {
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      audioData = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) {
        audioData[i] = (left[i] + right[i]) / 2;
      }
    } else {
      audioData = audioBuffer.getChannelData(0);
    }
    
    // Convert float32 to int16
    const samples = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      const s = Math.max(-1, Math.min(1, audioData[i]));
      samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // Create WAV file
    const dataLength = samples.length * 2;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);
    
    // Write WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * (bitDepth / 8), true);
    view.setUint16(32, numberOfChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write audio data
    const offset = 44;
    for (let i = 0; i < samples.length; i++) {
      view.setInt16(offset + i * 2, samples[i], true);
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  };

  const startRecording = async () => {
    if (recording) return;

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create MediaRecorder (WebM is most compatible)
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      // Collect audio data chunks
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // Handle recording stop event
      recorder.onstop = async () => {
        // Create WebM blob from collected chunks
        const webmBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        
        try {
          // Convert WebM to WAV
          const wavBlob = await convertToWav(webmBlob);
          onAudioReady(wavBlob);
        } catch (err) {
          alert("Failed to convert audio to WAV format");
          console.error(err);
        }
        
        // Clean up media stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Clear chunks for next recording
        chunksRef.current = [];
      };

      // Start recording
      recorder.start();
      setRecording(true);

      // Auto-stop after 10 seconds
      timeoutRef.current = setTimeout(() => {
        stopRecording();
      }, 10000);

    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Could not access microphone. Please check permissions.");
      setRecording(false);
    }
  };

  const stopRecording = () => {
    // Check if recorder exists and is currently recording
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      return;
    }

    // Clear auto-stop timeout if manually stopped
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Stop the recording
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex space-x-4">
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={recording && !mediaRecorderRef.current || converting}
          className={`${
            recording ? "bg-red-600 hover:bg-red-800" : "bg-blue-600 hover:bg-blue-800"
          } text-white px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {converting ? "Converting..." : recording ? "⏹ Stop Recording" : "🎤 Start Recording (10s max)"}
        </button>
        {recording && (
          <div className="flex items-center text-red-500 animate-pulse">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            Recording...
          </div>
        )}
      </div>
      {converting && (
        <div className="text-yellow-400 text-sm">
          Converting to WAV format...
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;