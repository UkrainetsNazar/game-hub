import { useEffect, useRef, useState } from "react";

const TurnTimer = ({ currentTurn, duration = 20 }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const timerRef = useRef(null);

  useEffect(() => {
    setTimeLeft(duration);
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentTurn, duration]);

  return (
    <div className="text-center text-sm text-gray-600 mb-2">
      ⏳ Time left: <span className="font-semibold">{timeLeft}</span>s
    </div>
  );
};

export default TurnTimer;
