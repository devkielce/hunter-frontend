"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  auctionDate: string; // ISO
  className?: string;
}

export function Countdown({ auctionDate, className = "" }: CountdownProps) {
  const [text, setText] = useState<string>("—");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const end = new Date(auctionDate).getTime();
      if (Number.isNaN(end)) {
        setText("—");
        setIsUrgent(false);
        return;
      }
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setText("Zakończona");
        setIsUrgent(false);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      const parts: string[] = [];
      if (days > 0) parts.push(`${days} d`);
      parts.push(`${hours} g`);
      parts.push(`${minutes} min`);
      setText(parts.join(" "));
      setIsUrgent(diff < 24 * 60 * 60 * 1000);
    };

    update();
    const interval = setInterval(update, 60 * 1000); // co minutę
    return () => clearInterval(interval);
  }, [auctionDate]);

  return (
    <span
      className={
        isUrgent
          ? `font-medium text-red-600 ${className}`
          : `text-neutral-600 ${className}`
      }
    >
      {text}
    </span>
  );
}
