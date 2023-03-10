import * as BlindSignature from 'blind-signatures';
import * as NodeRSA from 'node-rsa';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import {
  getPollEvent,
  isValidPollEvent,
  parsePollContent,
  zod_event_poll,
} from '@votestr-libs/nostr';
import { z } from 'zod';
import * as bs58 from 'bs58';
import BigInteger from 'jsbn';
import { getPoll, savePoll } from './prisma';

const zod_poll = z.object({
  id: zod_event_poll.shape.id,
  ends: z.date(),
  info: zod_event_poll.shape.content,
  pubkey: z.string(),
});

export type Poll = z.output<typeof zod_poll>;

export const bigToBs58 = (big: any) => bs58.encode(big.toByteArray());
export const bs58ToBig = (bs: string) => new BigInteger(bs58.decode(bs));

const KEY_PATH = process.env.KEY_DIR || path.join(homedir(), '.votestr');
const DOMAIN = process.env.DOMAIN || 'sign.votestr.com';

export const getBlindSignKeys = () => {
  try {
    const auth = readFileSync(KEY_PATH + '/auth.priv').toString();
    const vote = readFileSync(KEY_PATH + '/vote.priv').toString();
    return {
      auth: new NodeRSA(auth, 'pkcs8-private', undefined),
      vote: new NodeRSA(vote, 'pkcs8-private', undefined),
    };
  } catch (ex) {
    console.error(ex);
    console.error(`Priv keys not found at ${KEY_PATH} Generating new keys`);
    const new_auth = BlindSignature.keyGeneration({ b: 2048 }).exportKey(
      'pkcs8-private-pem'
    );
    const new_vote = BlindSignature.keyGeneration({ b: 2048 }).exportKey(
      'pkcs8-private-pem'
    );
    if (!existsSync(KEY_PATH)) {
      mkdirSync(KEY_PATH, { recursive: true });
    }
    try {
      writeFileSync(KEY_PATH + '/auth.priv', new_auth);
      writeFileSync(KEY_PATH + '/vote.priv', new_vote);
    } catch (ex) {
      console.log(ex);
    }
    return {
      auth: new NodeRSA(new_auth, 'pkcs8-private', undefined),
      vote: new NodeRSA(new_vote, 'pkcs8-private', undefined),
    };
  }
};

export const getOrFetchPollData = async (poll_id: string) => {
  const poll = await getPoll(poll_id);
  const info = parsePollContent(poll?.info ?? '');
  if (poll && info) return { ...poll, info };
  const raw_event = await getPollEvent(
    poll_id,
    process.env.RELAY_ENDPOINT ?? 'wss://nostr-dev.wellorder.net'
  );
  const valid = isValidPollEvent(raw_event);
  if (!valid) {
    throw new Error(`Poll id ${poll_id} not found`);
  }
  const info_new = parsePollContent(raw_event.content);
  if (info_new?.sign !== `${DOMAIN}`) {
    throw new Error(`Poll id ${poll_id} sign domain mismatch`);
  }
  await savePoll(raw_event, info_new.ends);
  const poll_new = await getPoll(poll_id);
  const info_newnew = parsePollContent(poll_new?.info ?? '');
  return { ...poll_new, info: info_newnew } as Poll;
};
