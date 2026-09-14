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

    @keyframes vaaniFlame {
      from { transform: translateY(1px) scale(.94) rotate(-2deg); filter: brightness(.92); }
      to { transform: translateY(-5px) scale(1.08) rotate(3deg); filter: brightness(1.14); }
    }

    @keyframes vaaniFirefly {
      0% { opacity: .18; transform: translate3d(0, 0, 0) scale(.8); }
      45% { opacity: 1; transform: translate3d(10px, -9px, 0) scale(1.15); }
      100% { opacity: .28; transform: translate3d(-7px, 13px, 0) scale(.9); }
    }

    .room-scrollbar-hidden::-webkit-scrollbar {
      display: none;
    }
  `}</style>
);

export default RoomStyles;
