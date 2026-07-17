"use client";

import { useEffect } from "react";

export default function Modal({
  id,
  show,
  onClose,
  children,
  maxWidth = "max-w-lg",
  maxHeight = "",
}) {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      id={id}
      className={`modal-backdrop ${show ? "show" : ""}`}
      onClick={handleBackdropClick}
    >
      <div
        className={`modal-content glass-strong rounded-2xl w-full ${maxWidth} ${maxHeight} overflow-y-auto`}
      >
        {children}
      </div>
    </div>
  );
}
