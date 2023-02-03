import Button from '@mui/base/ButtonUnstyled';
import { EventPoll } from '@votestr-libs/nostr';

type VoteButtonProps = {
  label: string;
  num: number;
  poll: EventPoll;
  clickVote: () => void;
  selected: boolean;
};

const VoteButton = ({ label, num, selected, clickVote }: VoteButtonProps) => {
  return (
    <div className="mb-1 py-1">
      <Button
        className={`w-full rounded-md border-4 p-5 text-left text-lg font-semibold drop-shadow-md focus:border-vote${num} transition-opacity transition-shadow hover:drop-shadow-lg focus:outline-0 hover:border-vote${num}/100 ${
          selected ? `border-vote${num}/100` : ``
        }`}
        onClick={clickVote}
      >
        {label}
      </Button>
    </div>
  );
};

export default VoteButton;
