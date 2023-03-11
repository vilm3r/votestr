import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useEffect, useRef, useState } from 'react';
import {
  publishAuthEvent,
  zod_event_poll,
  EventPollInfo,
  hexToBech32,
  serializePoll,
} from '@votestr-libs/nostr';
import TextField from '../components/TextField';
import DatePicker from '../components/DatePicker';
import Button from '../components/Button';
import Switch from '../components/Switch';
import Tabs from '../components/Tabs';
import Header from '../components/Header';
import ExtensionWarning from '../components/ExtensionWarning';
import {
  Accordian,
  AccordianDetails,
  AccordianSummary,
  AccordianItem,
} from '../components/Accordian';
import { timeout } from '@votestr-libs/utils';
import { useRouter } from 'next/router';
import LoadingDots from '../components/LoadingDots';
import { useImmer } from 'use-immer';

// DO NOT REMOVE - NX + NEXT STANDALONE WORKAROUND
import path from 'path';
import Head from 'next/head';
import { InferGetServerSidePropsType } from 'next';
path.resolve('./next.config.js');
// DO NOT REMOVE

const getPollEnd = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

// // for testing
// const getPollEnd = (minutes: number) =>
//   new Date(Date.now() + minutes * 60 * 1000).toISOString();

const waitForNostr = async (wait: number): Promise<void> => {
  if ((window as any).nostr || wait === 0) {
    await timeout(500); // wait for Alby to initialize because my page is too fast :P
    return;
  }
  await timeout(50);
  return waitForNostr(wait - 50);
};

const hasErrors = (zod: any, keys: (string | number)[]) =>
  zod?.error?.issues.find(
    ({ path }: { path: string[] }) =>
      keys.length === path.length && keys.every((val, i) => val === path[i])
  ) != undefined;

export const getServerSideProps: any = async (
  ctx: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
  const cache_age = 3600;
  ctx.res.setHeader(
    'Cache-Control',
    `s-maxage=${cache_age}, stale-while-revalidate=${cache_age}`
  );
  const props = {
    config: {
      sign: process.env.NEXT_PUBLIC_SIGN_ENDPOINT ?? 'https://sign.votestr.com',
      tally:
        process.env.NEXT_PUBLIC_TALLY_ENDPOINT ?? 'https://tally.votestr.com',
      relay:
        process.env.NEXT_PUBLIC_RELAY_ENDPOINT ??
        'wss://nostr-dev.wellorder.net',
    },
  };
  return { props };
};

type PollState = {
  title?: string;
  choices: (string | undefined)[];
  options: {
    type: 'simple' | 'ranked';
    randomize: boolean;
    percent: boolean;
    secret: boolean;
    show_creator: boolean;
    modify_minutes: number;
    show_results: string;
  };
  ends: string;
  sign: string;
  tally: string;
};

type IndexProps = {
  config: {
    tally: string;
    sign: string;
    relay: string;
  };
};

export function Index({ config }: IndexProps) {
  const pubkey = useRef<string>();
  const [poll_info, setPollInfo] = useImmer<PollState>({
    title: undefined,
    choices: [undefined, undefined],
    options: {
      type: 'simple',
      randomize: true,
      percent: true,
      secret: false,
      show_creator: true,
      modify_minutes: 0,
      show_results: 'after-vote',
    },
    ends: getPollEnd(1),
    sign: config.sign,
    tally: config.tally,
  });
  const [show_extension_warning, setShowExtensionWarning] = useState(false);
  const [poll_length, setPollLength] = useState('1');
  const [page_state, setPageState] = useState<'init' | 'creating' | 'error'>(
    'init'
  );
  const router = useRouter();

  const valid = zod_event_poll.shape.content.safeParse(poll_info);
  const errors = {
    title: hasErrors(valid, ['title']),
    choices: poll_info.choices.map((_, i) => hasErrors(valid, ['choices', i])),
    modify_minutes: hasErrors(valid, ['options', 'modify_minutes']),
    ends: hasErrors(valid, ['ends']),
    sign: hasErrors(valid, ['sign']),
    tally: hasErrors(valid, ['tally']),
  };

  useEffect(() => {
    (async () => {
      await waitForNostr(2000);
      try {
        await (window as any).nostr.enable();
      } catch (ex) {
        // suppress error in case nos2x
      }
      try {
        pubkey.current = await (window as any).nostr.getPublicKey();
      } catch (ex) {
        console.error(ex);
        return setShowExtensionWarning(true);
      }
    })();
  }, []);

  async function createNewPoll() {
    setPageState('creating');
    const { relayInit } = await import('nostr-tools');
    const { getCreatePollReq } = await import('@votestr-libs/nostr');

    const event = await getCreatePollReq(
      pubkey.current as string,
      poll_info as EventPollInfo
    );
    const relay = relayInit(config.relay);
    await relay.connect();
    const { id } = await publishAuthEvent(relay, {
      ...event,
      content: serializePoll(event.content),
    });
    router.push(`/p/${hexToBech32(id, 'note').slice(4)}`);
  }

  type FlipOptions = Exclude<
    keyof PollState['options'],
    'type' | 'modify_minutes' | 'show_results'
  >;

  function flipSwitch(key: FlipOptions) {
    setPollInfo((draft) => {
      draft.options[key] = !draft.options[key];
    });
  }

  return (
    <div>
      <Head>
        <title>Votestr</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta
          name="description"
          content="Create your next poll on Nostr with Votestr!"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <Header show_create_cta={false} />
      <ExtensionWarning
        open={show_extension_warning}
        handleClose={() => setShowExtensionWarning(false)}
      />
      <div className="m-auto max-w-3xl p-10">
        <div className="text-3xl font-bold">Create new poll</div>
        <div>
          <TextField
            label="Title"
            error={poll_info.title != undefined && errors.title}
            errorText="Max 25 characters"
            value={poll_info.title}
            onChange={(x) =>
              setPollInfo((draft) => {
                draft.title = x;
              })
            }
          />
        </div>
        {poll_info.choices.map((value, i) => (
          <div key={i} style={{ paddingTop: '1rem' }}>
            <TextField
              label={`Choice ${i + 1}`}
              error={poll_info.choices[i] != undefined && errors.choices[i]}
              errorText="Max 25 characters"
              value={value}
              onChange={(x) =>
                setPollInfo((draft) => {
                  draft.choices = draft.choices.map((y, j) =>
                    i === j ? x : y
                  );
                })
              }
            />
          </div>
        ))}
        <div className="py-2">
          <Button
            variant="secondary"
            className={`${
              poll_info.choices.length > 9 ? 'hidden' : 'flex'
            } py-2 px-4`}
            onClick={() =>
              setPollInfo((draft) => {
                draft.choices.push(undefined);
              })
            }
          >
            Add another choice
          </Button>
        </div>
        <div className="py-5">
          <Tabs
            label="Poll duration"
            tabs={[
              ['1', '1 Day'],
              ['3', '3 Days'],
              ['7', '7 Days'],
              ['custom', 'Custom'],
            ]}
            value={poll_length}
            onChange={(value: string) => {
              setPollLength(value);
              if (value !== 'custom') {
                setPollInfo((draft) => {
                  draft.ends = getPollEnd(parseInt(value) ?? 1);
                });
              }
            }}
          />
        </div>
        <div className="pb-5">
          <DatePicker
            className={`${poll_length === 'custom' ? 'flex' : 'hidden'}`}
            label=""
            value={poll_info.ends}
            onChange={(ends: string) => {
              if (ends) {
                setPollInfo((draft) => {
                  draft.ends = ends;
                });
              }
            }}
          />
        </div>
        <Accordian>
          <AccordianItem id="1" content_size="900px">
            <AccordianSummary
              expand_icon={<ExpandMoreIcon className="text-3xl" />}
            >
              Additional Settings
            </AccordianSummary>
            <AccordianDetails>
              <div>
                <Tabs
                  label="Poll type"
                  tabs={[
                    ['simple', 'Simple'],
                    ['ranked', 'Ranked-Choice'],
                  ]}
                  value={poll_info.options.type}
                  onChange={(type: PollState['options']['type']) =>
                    setPollInfo((draft) => {
                      draft.options.type = type;
                    })
                  }
                />
                <div>
                  <Switch
                    label="Randomize"
                    checked={poll_info.options.randomize}
                    onClick={() => flipSwitch('randomize')}
                  />
                </div>
                <Switch
                  label="Secret"
                  checked={poll_info.options.secret}
                  onClick={() => flipSwitch('secret')}
                />
                <Switch
                  label="Percent"
                  checked={poll_info.options.percent}
                  onClick={() => flipSwitch('percent')}
                />
                <Switch
                  label="Show creator"
                  checked={poll_info.options.show_creator}
                  onClick={() => flipSwitch('show_creator')}
                />
                <div>
                  <Tabs
                    label="Revote length"
                    tabs={[
                      [0, 'No revote'],
                      [1, '1 minute'],
                      [5, '5 minutes'],
                      [-1, 'Always'],
                    ]}
                    value={poll_info.options.modify_minutes}
                    onChange={(value: number) =>
                      setPollInfo((draft) => {
                        draft.options.modify_minutes = value;
                      })
                    }
                  />
                </div>
                <div>
                  <Tabs
                    label="Show results"
                    tabs={[
                      ['after-vote', 'After vote'],
                      ['after-poll', 'Poll end'],
                      ['creator', 'Creator'],
                      ['always', 'Always'],
                    ]}
                    value={poll_info.options.show_results}
                    onChange={(value: string) =>
                      setPollInfo((draft) => {
                        draft.options.show_results = value;
                      })
                    }
                  />
                </div>
                <div>
                  <TextField
                    label="Sign endpoint"
                    error={poll_info.sign != undefined && errors.sign}
                    errorText="Must be a valid url"
                    value={poll_info.sign}
                    onChange={(x) =>
                      setPollInfo((draft) => {
                        draft.sign = x;
                      })
                    }
                  />
                </div>
                <div>
                  <TextField
                    label="Tally endpoint"
                    error={poll_info.tally != undefined && errors.tally}
                    errorText="Must be a valid url"
                    value={poll_info.tally}
                    onChange={(x) =>
                      setPollInfo((draft) => {
                        draft.tally = x;
                      })
                    }
                  />
                </div>
              </div>
            </AccordianDetails>
          </AccordianItem>
        </Accordian>
        <div className="py-5">
          <Button
            className="text-lg"
            disabled={!valid.success}
            onClick={createNewPoll}
          >
            <div
              className={`${
                page_state === 'creating' ? 'opacity-0' : 'opacity-1'
              }`}
            >
              Create poll
            </div>
            <div
              className={`${
                page_state === 'creating' ? 'opacity-1' : 'opacity-0'
              }`}
            >
              <LoadingDots />
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Index;
