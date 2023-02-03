import UnstyledButton from '@mui/base/ButtonUnstyled';
import { ReactElement } from 'react';

const getStyles = (variant: string, disabled: boolean) => {
  const base =
    'block rounded-md border-[1px] px-10 py-4 text-sm drop-shadow-md font-medium transition';
  switch (true) {
    case variant === 'primary' && !disabled:
      return `${base} bg-indigo-600 text-white hover:bg-indigo-800 dark:border-indigo-600`;
    case variant === 'secondary' && !disabled:
      return `${base} bg-white border-indigo-600 text-indigo-600 hover:bg-gray-100 dark:bg-[#08090A] dark:border-white dark:text-white dark:hover:bg-gray-800`;
    case variant === 'primary' && disabled:
      return `${base} bg-gray-300 hover:bg-gray-300 text-black dark:bg-gray-800 dark:text-gray-500 dark:border-gray-800 cursor-not-allowed`;
    default:
      return `${base}`;
  }
};

type ButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  children: ReactElement[] | ReactElement | string;
  className?: string;
  variant?: 'primary' | 'secondary';
};

const Button = ({
  className,
  children,
  onClick,
  disabled = false,
  variant = 'primary',
}: ButtonProps) => {
  return (
    <>
      <UnstyledButton
        className={`${getStyles(variant, disabled)} ${className}`}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </UnstyledButton>
    </>
  );
};

export default Button;
