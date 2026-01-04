import React from "react";

const Stats = () => {
  const data = [
    { number: "120+", label: "Languages" },
    { number: "50K+", label: "Active Users" },
    { number: "1M+", label: "Conversations" },
  ];

  return (
    <div className="w-full flex justify-center">
      <div className="grid grid-cols-3 gap-4 text-center max-w-[400px]">
        {data.map((item, i) => (
          <div key={i}>
            <h2 className="text-3xl font-bold">{item.number}</h2>
            <p className="text-gray-500">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stats;
