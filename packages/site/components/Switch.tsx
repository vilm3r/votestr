import UnstyledSwitch, { useSwitch } from '@mui/base/SwitchUnstyled';

type SwitchProps = {
  label: string;
  checked: boolean;
  onClick: () => void;
  disabled?: boolean;
};

const Switch = ({ label, checked, onClick, disabled = false }: SwitchProps) => {
  const props = useSwitch({ checked, disabled });

  return (
    <div className="flex">
      <UnstyledSwitch
        slotProps={{
          root: {
            className: 'relative inline-block w-14 h-8 m-3 cursor-pointer',
          },
          track: {
            className: `rounded-full block w-full h-full absolute ${
              props.checked ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-700'
            }  `,
          },
          thumb: {
            className: `block w-6 h-6 top-[4px] bg-white rounded-full relative transition-all ${
              props.checked ? 'left-7' : 'left-1'
            }`,
          },
          input: {
            className: `opacity-0 absolute w-full h-full top-0 left-0 m-0 ${
              props.disabled ? 'cursor-not-allowed' : 'cursor-pointer'
            } `,
          },
        }}
        onChange={() => !props.disabled && onClick()}
      />
      <label className="self-center">{label}</label>
    </div>
  );
};

export default Switch;
