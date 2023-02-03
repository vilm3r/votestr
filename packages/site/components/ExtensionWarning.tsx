import Modal from '@mui/base/ModalUnstyled';
import CloseIcon from '@mui/icons-material/Close';
import React from 'react';
import clsx from 'clsx';
import Button from './Button';
import ButtonUnstyled from '@mui/base/ButtonUnstyled';

type ExtensionWarningProps = {
  open: boolean;
  handleClose: () => void;
};

// eslint-disable-next-line react/display-name
const Backdrop = React.forwardRef<
  HTMLDivElement,
  { open?: boolean; className: string }
>((props, ref) => {
  const { open, className, ...other } = props;
  return (
    <div
      className={`${clsx(
        { 'MuiBackdrop-open': open },
        className
      )} fixed right-0 left-0 top-0 bottom-0 z-10 bg-black opacity-20`}
      ref={ref}
      {...other}
    />
  );
});

const ExtensionWarning = ({ open, handleClose }: ExtensionWarningProps) => (
  <Modal
    aria-labelledby="unstyled-modal-title"
    aria-describedby="unstyled-modal-description"
    open={open}
    onClose={handleClose}
    className="fixed right-0 bottom-0 top-0 left-0 z-50 flex items-center justify-center"
    slots={{
      backdrop: Backdrop,
    }}
  >
    <div className="z-50 w-[20rem] flex-row rounded-lg bg-white px-10 pt-10 pb-7 outline-0 drop-shadow-lg dark:bg-[#08090A]">
      <div className="text-right">
        <ButtonUnstyled onClick={handleClose}>
          <CloseIcon className="relative top-[-2rem] right-[-2rem] " />
        </ButtonUnstyled>
      </div>
      <div className="pb-10 text-lg font-medium">
        You need to install{' '}
        <a
          className="underline"
          href="https://chrome.google.com/webstore/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp"
        >
          nos2x
        </a>{' '}
        or{' '}
        <a
          className="underline"
          href="https://chrome.google.com/webstore/detail/alby-bitcoin-lightning-wa/iokeahhehimjnekafflcihljlcjccdbe"
        >
          Alby
        </a>{' '}
        to be able to vote and create polls.
      </div>
      <div>
        <Button onClick={handleClose} className="m-auto text-lg">
          Dismiss
        </Button>
      </div>
    </div>
  </Modal>
);

export default ExtensionWarning;
