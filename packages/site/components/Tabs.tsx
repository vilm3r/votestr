import TabsListUnstyled from '@mui/base/TabsListUnstyled';
import TabsUnstyled from '@mui/base/TabsUnstyled';
import TabUnstyled from '@mui/base/TabUnstyled';

const Tab = ({
  label,
  onClick,
  selected,
}: {
  label: string;
  onClick: () => void;
  selected: boolean;
}) => (
  <TabUnstyled
    className={`${
      selected
        ? 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700'
        : 'border-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
    } w-full rounded-md border-[1px] px-8 py-2 text-lg drop-shadow-md`}
    onClick={onClick}
  >
    {label}
  </TabUnstyled>
);

const Tabs = <T extends string | number>({
  label,
  tabs,
  value,
  defaultValue,
  onChange,
}: {
  tabs: [T, string][];
  value: T;
  label: string;
  defaultValue?: string;
  onChange: (_: T) => void;
}) => (
  <div>
    <label className="text-sm">{label}</label>
    <TabsUnstyled value={value} defaultValue={defaultValue}>
      <TabsListUnstyled className="grid grid-cols-2 gap-5 py-2 md:flex md:flex-nowrap">
        {tabs.map((tab) => (
          <Tab
            key={tab[0]}
            label={tab[1]}
            selected={value === tab[0]}
            onClick={() => onChange(tab[0])}
          />
        ))}
      </TabsListUnstyled>
    </TabsUnstyled>
  </div>
);

export default Tabs;
