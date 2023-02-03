import { Draggable } from 'react-beautiful-dnd';
import DragHandleIcon from '@mui/icons-material/DragHandle';

type VoteButtonProps = {
  label: string;
  num: number;
  i: number;
};

const VoteRanked = ({ label, i, num }: VoteButtonProps) => {
  return (
    <Draggable key={label} draggableId={num + ''} index={i}>
      {(provided: any) => (
        <li
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="border-b-[.5rem] border-transparent"
        >
          <div className="w-full rounded-md border-4 bg-white p-5 text-left text-lg font-semibold drop-shadow-md dark:bg-[#08090A]">
            <div className="flex">
              <div className="flex-grow">{label}</div>
              <div>
                <DragHandleIcon />
              </div>
            </div>
          </div>
        </li>
      )}
    </Draggable>
  );
};

export default VoteRanked;
