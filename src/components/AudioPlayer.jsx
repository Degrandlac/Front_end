import React, { useEffect, useRef } from "react";

export default function AudioPlayer({ src }) {
  const audioRef = useRef();

  useEffect(() => {
    if (src) {
      audioRef.current.src = src;
      audioRef.current.play();
    }
  }, [src]);

  return <audio ref={audioRef} controls className="w-full mt-4" />;
}
