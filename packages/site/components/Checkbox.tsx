type CheckboxProps = {
  label: string;
  checked: boolean;
  onClick: () => void;
};

const Checkbox = ({ label, checked, onClick }: CheckboxProps) => (
  <>
    <label htmlFor={label}>{label}</label>
    <input name={label} type="checkbox" checked={checked} onClick={onClick} />
  </>
);

export default Checkbox;
