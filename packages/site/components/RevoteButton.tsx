import { useEffect, useState } from 'react';
import Button from './Button';

type RevoteButtonProps = {
  modify_minutes: number;
  show_results: string;
  choice?: string;
  created_at?: string;
  onClick: () => void;
};

const RevoteButton = ({
  modify_minutes,
  choice,
  show_results,
  created_at,
  onClick,
}: RevoteButtonProps) => {
  const [seconds, setSeconds] = useState<number | undefined>();
  const revote_length = modify_minutes * 60;
  const revote_end =
    new Date(created_at ?? '2008-10-31 18:10:00').getTime() / 1000 +
    revote_length;

  useEffect(() => {
    let interval = null as any;
    interval = setInterval(() => {
      setSeconds(Math.round(revote_end - Date.now() / 1000));
    }, 100);
    return () => clearInterval(interval);
  }, [seconds, created_at, modify_minutes]);

  const show_button = (() => {
    if (choice == undefined && show_results === 'always') return true;
    if (modify_minutes === -1) return true;
    if ((seconds ?? -1) > 0) return true;
    return false;
  })();

  return (
    <div className={`${show_button ? 'flex' : 'hidden'}`}>
      <Button className="text-xl" onClick={onClick}>
        Back to poll
      </Button>
      <div
        className={`text-md self-center pl-2 font-light ${
          modify_minutes === -1 || choice == undefined ? 'hidden' : 'flex'
        }`}
      >
        <div className="w-7 text-right">{seconds}</div>
        <div className="pl-1">seconds left to change vote</div>
      </div>
    </div>
  );
};

export default RevoteButton;
