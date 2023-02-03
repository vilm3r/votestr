import Input from '@mui/base/InputUnstyled';

type TextFieldProps = {
  value?: string;
  onChange: (_: string) => void;
  error?: boolean;
  disabled?: boolean;
  errorText?: string;
  label: string;
};

const TextField = ({
  value,
  onChange,
  disabled,
  error,
  errorText,
  label,
}: TextFieldProps) => (
  <>
    <label className="text-sm">{label}</label>
    <Input
      disabled={disabled}
      slotProps={{
        input: {
          className: `rounded-md p-2 border-gray-300 border-solid border-[1px] w-full ${
            error ? 'border-red-500' : 'border-gray-300'
          }`,
        },
      }}
      value={value ?? ''}
      onChange={(x) => onChange(x.target.value)}
    />
  </>
);

export default TextField;
