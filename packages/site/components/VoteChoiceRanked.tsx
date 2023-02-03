import { EventPoll } from '@votestr-libs/nostr';
import VoteRanked from './VoteRanked';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { useState } from 'react';
import { intToBs58 } from '@votestr-libs/utils';
import Button from './Button';

type VoteChoiceRankedProps = {
  poll: EventPoll;
  onClickVote: (_: string) => void;
};

const choicesToVoteString = (choices: { label: string; num: number }[]) =>
  choices.reduce((acc, choice) => acc + intToBs58(choice.num), '');

const orderChoices = (randomize: boolean, choices: string[]) =>
  [
    ...choices
      .map((x, i) => ({ label: x, num: i, rand: Math.random() }))
      .sort((a, b) => (randomize ? a.rand - b.rand : a.num - b.num)),
  ].map(({ label, num }) => ({ label, num }));

const VoteChoiceRanked = ({ poll, onClickVote }: VoteChoiceRankedProps) => {
  const [choices, setChoices] = useState(
    orderChoices(poll.content.options.randomize, poll.content.choices)
  );

  function handleOnDragEnd(result: any) {
    if (!result.destination) return;

    const items = Array.from(choices);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setChoices(items);
  }

  return (
    <>
      <div className="relative">
        <div className="absolute left-[-2.8rem]">
          {choices.map((_, i) => (
            <div key={i} className="flex h-[5.2rem]">
              <div className="self-center pr-2 text-2xl font-medium">
                #{i + 1}
              </div>
            </div>
          ))}
        </div>
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <Droppable droppableId="choices">
            {(provided: any) => (
              <ul
                style={{ listStyleType: 'none' }}
                className="w-full"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {choices.map(({ label, num }, i) => (
                  <VoteRanked key={num} num={num} label={label} i={i} />
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      <div className="flex gap-5 pt-5">
        <Button
          className="text-xl"
          onClick={() => onClickVote(choicesToVoteString(choices))}
        >
          Submit Vote
        </Button>

        <Button
          className="text-xl"
          variant="secondary"
          onClick={() => onClickVote('0')}
        >
          Show Results
        </Button>
      </div>
    </>
  );
};

export default VoteChoiceRanked;
