import { bs58ToInt, getLocalString, getPollPercent } from '@votestr-libs/utils';
import { EventPoll } from '@votestr-libs/nostr';
import { TallyDataType } from '../pages/p/[id]';
import ResultCard from './ResultCard';
import RevoteButton from './RevoteButton';
import { useEffect, useState } from 'react';

type VoteResultsRankedProps = {
  poll: EventPoll;
  tally_data: TallyDataType;
  pub?: string;
  onClickRevote: () => void;
};

const VoteResultsRanked = ({
  poll,
  tally_data,
  pub,
  onClickRevote,
}: VoteResultsRankedProps) => {
  const [ended, setEnded] = useState(
    Date.now() > new Date(poll.content.ends).getTime()
  );

  useEffect(() => {
    let interval = null as any;
    interval = setInterval(() => {
      if (!ended && Date.now() > new Date(poll.content.ends).getTime()) {
        setEnded(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [poll]);

  const data =
    poll.content.options.type === 'ranked' && !ended
      ? tally_data.first_round ?? {}
      : tally_data.results ?? {};
  const percent = poll.content.options.percent
    ? data
    : getPollPercent(data, tally_data.total ?? 0);
  const results_arr = Object.entries(data ?? {});
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

  if (poll.content.options.show_results === 'after-poll' && !ended)
    return (
      <div>
        <p className="m-auto py-5 text-2xl font-medium tracking-tight sm:text-4xl">
          Thanks for voting! Check back after{' '}
          {getLocalString(new Date(poll.content.ends))} to see the final
          results.
        </p>
        <RevoteButton
          modify_minutes={poll.content.options.modify_minutes}
          choice={tally_data?.choice}
          show_results={poll.content.options.show_results}
          created_at={tally_data?.created_at}
          onClick={onClickRevote}
        />
      </div>
    );

  if (poll.content.options.show_results === 'creator' && poll.pubkey !== pub)
    return (
      <div>
        <p className="m-auto py-5 text-2xl font-medium tracking-tight sm:text-4xl">
          Thanks for voting!
        </p>
        <RevoteButton
          modify_minutes={poll.content.options.modify_minutes}
          choice={tally_data?.choice}
          show_results={poll.content.options.show_results}
          created_at={tally_data?.created_at}
          onClick={onClickRevote}
        />
      </div>
    );

  return (
    <div>
      {sorted_results.map((x, i) => (
        <ResultCard
          key={i}
          num={i}
          label={x.choice}
          percent={x.percent}
          count={x.votes}
          choice={tally_data.choice === x.num}
          poll_type={poll.content.options.type}
          eliminated={ended && (tally_data.results as any)[x.num] === 0}
        />
      ))}
      <div className="pt-2 pb-4">
        <span>
          {tally_data.total} vote{tally_data.total === 1 ? '' : 's'}
        </span>
        {' - '}
        <span>
          Poll {ended ? 'ended ' : 'ends '}
          {getLocalString(new Date(poll.content.ends))}
        </span>
      </div>
      <div>
        <RevoteButton
          modify_minutes={poll.content.options.modify_minutes}
          choice={tally_data?.choice}
          show_results={poll.content.options.show_results}
          created_at={tally_data?.created_at}
          onClick={onClickRevote}
        />
      </div>
    </div>
  );
};

export default VoteResultsRanked;
