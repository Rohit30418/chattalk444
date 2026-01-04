import React, { useRef, useEffect } from "react";

const ScreenShare = ({ screenStream }) => {
  const screenVideoRef = useRef(null);

  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  return (
    <div className="w-full">
      {screenStream ? (
        <video ref={screenVideoRef} autoPlay playsInline style={{ width: "100%", height: "auto" }} />
      ) : (
        <p>No screen is being shared currently.</p>
      )}
    </div>
  );
};

export default ScreenShare;
