const RoomStyles = () => (
  <style>{`
    @keyframes roomFloatUp {
      0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
      82% { opacity: 1; }
      100% { opacity: 0; transform: translateX(-50%) translateY(-135px) scale(1.45); }
    }

    @keyframes roomFadeInUp {
      from { opacity: 0; transform: translate(-50%, 12px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }

    @keyframes roomPopIn {
      from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
      to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }

    .room-scrollbar-hidden::-webkit-scrollbar {
      display: none;
    }
  `}</style>
);

export default RoomStyles;
