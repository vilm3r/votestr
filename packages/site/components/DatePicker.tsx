import { getLocalISOString } from '@votestr-libs/utils';

type DatePickerProps = {
  value: string;
  onChange: (_: string) => void;
  label: string;
  className: string;
};

const DatePicker = ({ label, className, value, onChange }: DatePickerProps) => (
  <div className={className}>
    <div>
      <label className="text-sm">{label}</label>
    </div>
    <input
      className="rounded-md border-[1px] border-gray-300 p-2"
      type="datetime-local"
      value={getLocalISOString(new Date(value))}
      onChange={(x) => {
        onChange(new Date(x.target.value).toISOString());
      }}
    />
  </div>
);

export default DatePicker;
