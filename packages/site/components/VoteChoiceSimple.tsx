import { intToBs58 } from '@votestr-libs/utils';
import { useState } from 'react';
import { EventPoll, Poll } from '@votestr-libs/nostr';
import Button from './Button';
import VoteButton from './VoteButton';

type VoteChoiceSimpleProps = {
  poll: Poll;
  onClickVote: (_: string) => void;
  onClickResults: () => void;
};

const setChoices = (randomize: boolean, choices: string[]) => [
  ...choices
    .map((x, i) => ({ label: x, num: i, rand: Math.random() }))
    .sort((a, b) => (randomize ? a.rand - b.rand : a.num - b.num)),
];

const VoteChoiceSimple = ({
  poll,
  onClickVote,
  onClickResults,
}: VoteChoiceSimpleProps) => {
  const [choice, setChoice] = useState<number | undefined>();
  const [choices, _] = useState(
    setChoices(poll.content.options.randomize, poll.content.choices)
  );

  return (
    <div>
      {choices.map(({ label, num }, i) => (
        <VoteButton
          key={num}
          num={i}
          label={label}
          selected={choice === num}
          poll={poll}
          clickVote={() => setChoice(num)}
        />
      ))}
      <div className="flex gap-5 pt-5">
        <Button
          className="text-xl"
          onClick={() => choice != undefined && onClickVote(intToBs58(choice))}
        >
          Submit Vote
        </Button>

        {['always', 'after-vote'].includes(
          poll.content.options.show_results
        ) && (
          <Button
            className="text-xl"
            variant="secondary"
            onClick={onClickResults}
          >
            Show Results
          </Button>
        )}
      </div>
    </div>
  );
};

export default VoteChoiceSimple;
