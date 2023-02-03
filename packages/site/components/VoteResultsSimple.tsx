import { bs58ToInt, getLocalString, getPollPercent } from '@votestr-libs/utils';
import { EventPoll } from '@votestr-libs/nostr';
import { TallyDataType } from '../pages/p/[id]';
import ResultCard from './ResultCard';
import RevoteButton from './RevoteButton';

type VoteResultsSimpleProps = {
  poll: EventPoll;
  tally_data: TallyDataType;
  onClickRevote: () => void;
};

const VoteResultsSimple = ({
  poll,
  tally_data,
  onClickRevote,
}: VoteResultsSimpleProps) => {
  const percent = poll.content.options.percent
    ? tally_data.results ?? {}
    : getPollPercent(tally_data.results ?? {}, tally_data.total ?? 0);
  const results_arr = Object.entries(tally_data.results ?? {});
  const sorted_results = [
    ...results_arr
      .map((x) => ({
        ...(poll.content.options.percent ? {} : { votes: x[1] }),
        choice: poll.content.choices[bs58ToInt(x[0])],
        percent: percent[x[0]],
        num: x[0],
      }))
      .sort((a, b) =>
        poll.content.options.percent
          ? b.percent - a.percent
          : (b.votes as number) - (a.votes as number)
      ),
  ];

  const ends = new Date(poll.content.ends);

  return (
    <div>
      {sorted_results.map((x, i) => (
        <ResultCard
          key={i}
          num={i}
          label={x.choice}
          percent={x.percent}
          count={x.votes}
          choice={tally_data?.choice === x.num}
        />
      ))}
      <div className="pt-2 pb-4">
        <span>
          {tally_data.total} vote{tally_data.total === 1 ? '' : 's'}
        </span>
        {' - '}
        <span>
          Poll {ends.getTime() < Date.now() ? 'ended ' : 'ends '}
          {getLocalString(ends)}
        </span>
      </div>
      <RevoteButton
        modify_minutes={poll.content.options.modify_minutes}
        created_at={tally_data?.created_at ?? new Date().toISOString()}
        onClick={onClickRevote}
      />
    </div>
  );
};

export default VoteResultsSimple;
