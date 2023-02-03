type ResultCardProps = {
  label: string;
  num: number;
  percent: number;
  count?: number;
  choice?: boolean;
  eliminated?: boolean;
};

const ResultCard = ({
  label,
  percent,
  count,
  choice,
  num,
  eliminated = false,
}: ResultCardProps) => {
  return (
    <div className="py-2 text-xl font-medium">
      <div className="flex">
        <label className="flex-grow">
          <span
            className={`flex-grow ${eliminated ? 'line-through' : ''}`}
          >{`${label} `}</span>
          <i className="text-md font-light">
            {count != undefined
              ? `- ${count} vote${count === 1 ? '' : 's'}`
              : ''}
            {eliminated ? 'Eliminated' : ''}
          </i>
        </label>
        <i
          className={`text-md pr-20 text-right font-light ${
            choice ? 'inline-block' : 'hidden'
          }`}
        >
          Your choice
        </i>
      </div>
      <span className="flex h-5">
        <span className="relative block h-full w-full rounded-lg bg-gray-200 dark:bg-gray-700">
          <span
            style={{ width: `${percent}%` }}
            className={`absolute left-0 top-0 block h-full transition-transform duration-150 bg-vote${num} rounded-lg`}
          />
        </span>
        <span className="w-20 self-center pl-2">{percent}%</span>
      </span>
    </div>
  );
};

export default ResultCard;
