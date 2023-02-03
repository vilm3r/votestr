import { intToBs58 } from '@votestr-libs/utils';
import { useState } from 'react';
import { EventPoll } from '@votestr-libs/nostr';
import Button from './Button';
import VoteButton from './VoteButton';

type VoteChoiceSimpleProps = {
  poll: EventPoll;
  onClickVote: (_: string) => void;
};

const setChoices = (randomize: boolean, choices: string[]) => [
  ...choices
    .map((x, i) => ({ label: x, num: i, rand: Math.random() }))
    .sort((a, b) => (randomize ? a.rand - b.rand : a.num - b.num)),
];

const VoteChoiceSimple = ({ poll, onClickVote }: VoteChoiceSimpleProps) => {
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
      <div className="pb-5">
        <VoteButton
          key={'Show results'}
          label={'Show results'}
          num={poll.content.choices.length}
          selected={choice === poll.content.choices.length}
          poll={poll}
          clickVote={() => setChoice(-1)}
        />
      </div>
      <div>
        <Button
          className="text-xl"
          disabled={choice == undefined}
          onClick={() => {
            console.log(`click choice: ${choice}`);
            choice != undefined &&
              onClickVote(choice === -1 ? '0' : intToBs58(choice));
          }}
        >
          Submit Vote
        </Button>
      </div>
    </div>
  );
};

export default VoteChoiceSimple;
