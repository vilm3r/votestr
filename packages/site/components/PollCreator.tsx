import { ButtonUnstyled } from '@mui/base';
import { ContentCopy } from '@mui/icons-material';
import VerifiedIcon from '@mui/icons-material/Verified';

const PollCreator = ({ creator }: any) => (
  <div className="flex pb-5">
    <img
      alt="poll creator profile picture"
      src={creator.picture ?? '/user.png'}
      className="h-20 w-20 rounded-md"
    />
    <div className="self-center pl-2 text-lg">
      {creator?.name && (
        <div>
          {creator.name}
          {creator.nip05 ? (
            <VerifiedIcon className="ml-1 w-5 text-indigo-600" />
          ) : (
            ''
          )}
        </div>
      )}
      {creator?.nip05 && <div>{`@${creator.nip05}`}</div>}
      {creator?.pubkey && (
        <div>
          <span className="pr-1">{`${creator.pubkey.slice(
            0,
            9
          )}...${creator.pubkey.slice(58)}`}</span>
          <ButtonUnstyled
            onClick={() =>
              navigator.clipboard.writeText(creator.pubkey).catch(console.warn)
            }
          >
            <ContentCopy className="w-5 text-indigo-600" />
          </ButtonUnstyled>
        </div>
      )}
    </div>
  </div>
);

export default PollCreator;
