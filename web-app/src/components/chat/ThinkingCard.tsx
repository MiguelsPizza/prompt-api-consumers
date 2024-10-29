import { useState, useEffect } from 'react';
import { MessageCard } from './MessageCard';

export const ThinkingCard = () => {
  const [number, setNumber] = useState(1);

  useEffect(() => {
    const int = setInterval(() => setNumber(curr => (curr + 1) % 4), 300);
    return () => clearInterval(int);
  }, []);

  return (
    <MessageCard
      role="assistant"
      content={`thinking${'.'.repeat(number)}`}
    />
  );
};