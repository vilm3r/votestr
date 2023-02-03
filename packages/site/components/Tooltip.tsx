import PopperUnstyled from '@mui/base/PopperUnstyled';

type TooltipProps = {
  id: string;
  anchorEl: HTMLElement;
  open: boolean;
  children: any;
};

const Tooltip = ({ children, id, open, anchorEl }: TooltipProps) => (
  <PopperUnstyled id={id} open={open} anchorEl={anchorEl}>
    <div>{children}</div>
  </PopperUnstyled>
);

export default Tooltip;
