import { useEffect, useState } from 'react';
import Button from './Button';

type RevoteButtonProps = {
  modify_minutes: number;
  created_at: string;
  onClick: () => void;
};

const RevoteButton = ({
  modify_minutes,
  created_at,
  onClick,
}: RevoteButtonProps) => {
  const [seconds, setSeconds] = useState(9999);
  const revote_length = modify_minutes * 60;
  const revote_end = new Date(created_at).getTime() / 1000 + revote_length;

  useEffect(() => {
    let interval = null as any;
    interval = setInterval(() => {
      setSeconds(Math.round(revote_end - Date.now() / 1000));
    }, 100);
    return () => clearInterval(interval);
  }, [seconds, created_at, modify_minutes]);

  return (
    <div
      className={`${seconds > 0 || modify_minutes === -1 ? 'flex' : 'hidden'}`}
    >
      <Button className="text-2xl" onClick={onClick}>
        Revote
      </Button>
      <div
        className={`text-md self-center pl-2 font-light ${
          modify_minutes === -1 ? 'hidden' : 'flex'
        }`}
      >
        <div className="w-7 text-right">{seconds}</div>
        <div className="pl-1">seconds left to change vote</div>
      </div>
    </div>
  );
};

export default RevoteButton;
