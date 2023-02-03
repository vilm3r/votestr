import { useState, cloneElement, Children, ReactElement } from 'react';

type AccordianProps = {
  children: ReactElement[] | ReactElement;
};

export const Accordian = ({ children }: AccordianProps) => {
  const [open_item, setOpenItem] = useState<string | undefined>();

  return (
    <div>
      {Children.map(children, (child) =>
        cloneElement(child, { open_item, setOpenItem })
      )}
    </div>
  );
};

type AccordianSummaryProps = {
  children: ReactElement[] | ReactElement | string;
  setOpenItem?: (_: string) => void;
  open_item?: string;
  expand_icon: ReactElement[] | ReactElement;
  id?: string;
};

export const AccordianSummary = ({
  children,
  expand_icon,
  setOpenItem,
  open_item,
  id,
}: AccordianSummaryProps) => {
  return (
    <div
      className="flex rounded-md border-[1px] border-gray-300 p-5"
      onClick={() =>
        setOpenItem && setOpenItem(open_item === id ? 'none' : id ?? 'none')
      }
    >
      <div className="flex-grow self-center">{children}</div>
      <div className={`${open_item === id ? 'rotate-180' : ''} transition-all`}>
        {expand_icon}
      </div>
    </div>
  );
};

type AccordianDetailsProps = {
  children: ReactElement[] | ReactElement | string;
  open_item?: string;
  id?: string;
  content_size?: string;
};

export const AccordianDetails = ({
  children,
  open_item,
  id,
  content_size,
}: AccordianDetailsProps) => {
  return (
    <div
      style={{ maxHeight: open_item === id ? content_size : 0 }}
      className={`overflow-hidden transition-all duration-500`}
    >
      {children}
    </div>
  );
};

type AccordianItemProps = {
  children: ReactElement[];
  setOpenItem?: (_: string) => void;
  open_item?: boolean;
  id: string;
  content_size: string;
};

export const AccordianItem = ({
  children,
  open_item,
  setOpenItem,
  id,
  content_size,
}: AccordianItemProps) => {
  return (
    <div>
      {Children.map(children, (child) =>
        cloneElement(child, { open_item, setOpenItem, id, content_size })
      )}
    </div>
  );
};

const accordian_export = {
  Accordian,
  AccordianSummary,
  AccordianDetails,
  AccordianItem,
};

export default accordian_export;
