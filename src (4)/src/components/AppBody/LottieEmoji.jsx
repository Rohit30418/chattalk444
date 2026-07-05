import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";

const LottieEmoji = ({ codepoint, width, height }) => {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    if (!codepoint) return;

    let hex = codepoint;
    // If it's an emoji string, convert to hex codepoint
    if (typeof codepoint === "string" && codepoint.length > 1) {
      hex = codepoint.codePointAt(0).toString(16); // 🎉 → "1f389"
    }

    const url = `https://fonts.gstatic.com/s/e/notoemoji/latest/${hex}/lottie.json`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Emoji not found");
        return res.json();
      })
      .then((data) => setAnimationData(data))
      .catch((err) => {
        console.error("Failed to load emoji:", err);
        setAnimationData(null); // fallback
      });
  }, [codepoint]);

  if (!animationData) return null; // could fallback to just showing plain emoji

  return (
    <Lottie
      animationData={animationData}
      loop={true} className="mb-0"
      style={{ width, height }}
    />
  );
};

export default LottieEmoji;
