import { relayInit, Event, getEventHash, nip04, Relay } from 'nostr-tools';
import 'websocket-polyfill';
import { bech32 } from 'bech32';
import { z } from 'zod';

export const zod_event = z
  .object({
    id: z.string().optional(),
    kind: z.number().int().min(0),
    created_at: z.number(),
    content: z.string(),
    tags: z.tuple([z.string(), z.string()]).array(),
    pubkey: z.string(),
    sig: z.string(),
  })
  .strict();

export const zod_event_poll = zod_event
  .extend({
    id: z.string().length(64),
    content: z.object({
      title: z.string().min(1).max(100),
      choices: z.string().min(1).max(40).array().min(2).max(10),
      options: z.object({
        type: z.literal('simple').or(z.literal('ranked')),
        randomize: z.boolean(),
        percent: z.boolean(),
        secret: z.boolean(),
        show_creator: z.boolean(),
        modify_minutes: z.number().int().min(-1).max(60),
      }),
      sign: z.string().url(),
      tally: z.string().url(),
      ends: z.string().datetime({ offset: false, precision: 3 }),
    }),
  })
  .strict();

export type Poll = z.infer<typeof zod_event_poll>;

export const zod_event_sign_req = zod_event
  .extend({
    content: z.discriminatedUnion('type', [
      z.object({
        type: z.literal('auth'),
        blinded_auth: z.string().max(1000),
        blinded_vote: z.string().max(1000),
        poll_id: z.string().length(64),
        payload: z.string().max(1000),
      }),
      z.object({
        type: z.literal('vote'),
        poll_id: z.string().length(64),
        blinded_vote: z.string().max(1000),
      }),
      z.object({
        type: z.literal('payload'),
      }),
    ]),
  })
  .strict();

export type EventSignReq = z.infer<typeof zod_event_sign_req>;

export const zod_event_tally_req = zod_event
  .extend({
    content: z.discriminatedUnion('type', [
      z.object({
        type: z.literal('vote'),
        unblinded_auth: z.string().max(1000),
        unblinded_vote: z.string().max(1000),
        nonce: z.string().length(64),
        poll_id: z.string().length(64),
        choice: z.string().max(50),
        timestamp: z.string().datetime({ offset: false, precision: 3 }),
      }),
      z.object({
        type: z.literal('results'),
        nonce: z.string().length(64),
        poll_id: z.string().length(64),
      }),
    ]),
  })
  .strict();

export type EventTallyReq = z.infer<typeof zod_event_tally_req>;

export type EventPoll = z.infer<typeof zod_event_poll>;

export type EventPollInfo = z.infer<typeof zod_event_poll.shape.content>;

export type EventPollOptions = z.infer<
  typeof zod_event_poll.shape.content.shape.options
>;

export const encryptAnonContent = (
  priv: string,
  pub: string,
  content: string
) => nip04.encrypt(priv, pub, content);

export const publishAuthEvent = async (relay: Relay, event: Event) => {
  const tmp = {
    ...event,
    content:
      typeof event.content === 'string'
        ? event.content
        : JSON.stringify(event.content),
  };
  const id = getEventHash(tmp);
  const sig_event = await (window as any).nostr.signEvent({
    ...tmp,
    id,
  });
  relay.publish(sig_event);
  return sig_event;
};

export const getCreatePollReq = async (
  pubkey: string,
  content: EventPollInfo
) => ({
  kind: 1000,
  tags: [['client', 'votestr']],
  pubkey,
  created_at: Math.round(Date.now() / 1000),
  content,
});

export const getAuthPayloadReq = (pubkey: string, poll_id: string) => ({
  kind: 20004,
  tags: [['client', 'votestr']],
  pubkey,
  created_at: Math.round(Date.now() / 1000),
  content: JSON.stringify({
    type: 'payload',
    poll_id,
  }),
});

export const getAuthSignReq = (
  pubkey: string,
  poll_id: string,
  blinded_auth: string,
  blinded_vote: string,
  payload: string
) => ({
  kind: 20004,
  tags: [['client', 'votestr']],
  pubkey,
  created_at: Math.round(Date.now() / 1000),
  content: JSON.stringify({
    type: 'auth',
    poll_id,
    blinded_auth,
    blinded_vote,
    payload,
  }),
});

export const getAuthVoteReq = (
  pubkey: string,
  poll_id: string,
  blinded_vote: string
) => ({
  kind: 20004,
  tags: [['client', 'votestr']],
  pubkey,
  created_at: Math.round(Date.now() / 1000),
  content: JSON.stringify({
    type: 'vote',
    poll_id,
    blinded_vote,
  }),
});

export const getVoteResultsReq = (
  pubkey: string,
  nonce: string,
  poll_id: string
) => ({
  kind: 20004,
  tags: [['client', 'votestr']],
  pubkey,
  created_at: Math.round(Date.now() / 1000),
  content: JSON.stringify({
    type: 'results',
    nonce,
    poll_id,
  }),
});

export const getVoteReq = (
  pubkey: string,
  poll_id: string,
  nonce: string,
  unblinded_auth: string,
  unblinded_vote: string,
  timestamp: string,
  choice: string
) => ({
  kind: 20004,
  tags: [['client', 'votestr']],
  pubkey,
  created_at: Math.round(Date.now() / 1000),
  content: JSON.stringify({
    type: 'vote',
    nonce,
    poll_id,
    unblinded_auth,
    unblinded_vote,
    timestamp,
    choice,
  }),
});

const defaultOptions = {
  randomize: true,
  percent: true,
  secret: false,
  show_creator: true,
  modify_minutes: 0,
};

export const encodeOptions = ({
  randomize,
  percent,
  secret,
  show_creator,
  modify_minutes,
}: EventPollOptions) =>
  '' + randomize
    ? '1'
    : '0' + '|' + percent
    ? '1'
    : '0' + '|' + secret
    ? '1'
    : '0' + '|' + show_creator
    ? '1'
    : '0' + '|' + modify_minutes;

export const decodeOptions = (x: string) => {
  const options = x.split('|');
  const convert = (def: boolean | number, value: string) => {
    switch (typeof def) {
      case 'boolean':
        return value == '1';
      case 'number':
        return parseInt(value);
    }
  };
  return Object.fromEntries(
    Object.entries(defaultOptions).map((d, i) => [
      d[0],
      convert(d[1], options[i]) ?? d[1],
    ])
  );
};

export const getPollEvent = (
  poll_id: string,
  relay_url: string
): Promise<Event> =>
  new Promise((res, rej) => {
    let tmp: Event;
    const relay = relayInit(relay_url);
    relay
      .connect()
      .then(() => {
        const sub = relay.sub([{ ids: [poll_id] }]);
        sub.on('event', (event: Event) => {
          tmp = event;
        });
        sub.on('eose', () => {
          if (!tmp) console.error(`Couldn't find poll info for ${poll_id}`);
          res(tmp);
          sub.unsub();
          relay.close();
        });
      })
      .catch((e) => console.error(e));
  });

export const isValidPollEnd = (event_ends: string, created: number) => {
  const MAX_POLL_LENGTH_DAYS = 7;
  const ends = new Date(event_ends).getTime();
  return ends < created * 1000 + MAX_POLL_LENGTH_DAYS * 24 * 60 * 60 * 1000;
};

export const parsePollEvent = (event: Event) => {
  if (event?.id == undefined) return undefined;
  const content = JSON.parse(event.content);
  // const options = decodeOptions(content.options);
  const event_poll = { ...event, content: { ...content } };
  const valid = zod_event_poll.safeParse(event_poll);
  const valid_ends = isValidPollEnd(
    event_poll.content.ends,
    event_poll.created_at
  );
  if (!valid.success || !valid_ends) return undefined;
  return event_poll as EventPoll;
};

export const getPollCreator = (
  pubkey: string,
  relay_url: string
): Promise<Event> =>
  new Promise((res, rej) => {
    let tmp: Event;
    const relay = relayInit(relay_url);
    relay
      .connect()
      .then(() => {
        const sub = relay.sub([{ kinds: [0], authors: [pubkey] }]);
        sub.on('event', (event: Event) => {
          tmp = event;
        });
        sub.on('eose', () => {
          res(tmp);
          sub.unsub();
          relay.close();
        });
      })
      .catch((e) => console.error(e));
  });

export const parseCreator = async (creator: any, pubkey: string) => {
  if (creator?.content == undefined)
    return { pubkey: hexToBech32(pubkey, 'npub') };
  const content = JSON.parse(creator.content);
  const name = content.name;
  const picture = content.picture;
  if (!content.nip05) {
    return { name, picture, pubkey: hexToBech32(pubkey, 'npub') };
  }
  const nip05pubkey = (
    await (
      await fetch(
        `https://${
          content.nip05.split('@')[1]
        }/.well-known/nostr.json?name=${name}`
      )
    ).json()
  ).names[name];
  return {
    name,
    picture,
    pubkey: hexToBech32(pubkey, 'npub'),
    nip05:
      nip05pubkey === creator.pubkey ? content.nip05.split('@')[1] : undefined,
  };
};

export const bech32ToHex = (key: string) => {
  try {
    let { words } = bech32.decode(key);
    let buffer = Buffer.from(bech32.fromWords(words));
    return toHexString(buffer);
  } catch (error) {}
  return '';
};

export const hexToBech32 = (key: string, prefix: string) => {
  try {
    let words = bech32.toWords(fromHexString(key) as ArrayLike<number>);
    return bech32.encode(prefix, words);
  } catch (error) {
    // continue
  }
  return '';
};

export const toHexString = (buffer: Uint8Array) => {
  let hexString = buffer.reduce((s, byte) => {
    let hex = byte.toString(16);
    if (hex.length === 1) hex = '0' + hex;
    return s + hex;
  }, '');
  return hexString;
};

export const fromHexString = (str: string) => {
  if (str.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(str)) {
    return undefined;
  }
  let buffer = new Uint8Array(str.length / 2);
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = parseInt(str.substr(2 * i, 2), 16);
  }
  return buffer;
};