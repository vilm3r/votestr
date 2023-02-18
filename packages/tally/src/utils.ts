import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import * as path from 'path';
import { z } from 'zod';
import {
  getPollEvent,
  isValidPollEvent,
  parsePollContent,
  zod_event_poll,
} from '@votestr-libs/nostr';
import { getPollPercent, intToBs58 } from '@votestr-libs/utils';
import prisma, { getPoll, savePoll } from './prisma';

export const fetchAuthPubkey = async (sign_url: string) =>
  await (
    await fetch(`${sign_url}/auth.key`, {
      method: 'GET',
    })
  ).text();
export const fetchVotePubkey = async (sign_url: string) =>
  await (
    await fetch(`${sign_url}/vote.key`, {
      method: 'GET',
    })
  ).text();

const zod_poll = z.object({
  id: zod_event_poll.shape.id,
  ends: z.date(),
  info: zod_event_poll.shape.content,
  archived: z.boolean(),
  pubkey: z.string(),
  pubkey_auth: z.string(),
  pubkey_vote: z.string(),
});

export type Poll = z.output<typeof zod_poll>;

const DOMAIN = process.env.DOMAIN || 'tally.votestr.com';

// export const getOrFetchPollData = async (poll_id: string) => {
//   const poll = (await prisma.getPoll(poll_id)) as Poll;
//   const info = zod_event_poll.shape.content.safeParse(poll?.info ?? '');
//   if (poll && info.success) return { ...poll, info: info.data };
//   const event = parsePollEvent(
//     await getPollEvent(
//       poll_id,
//       process.env.RELAY_URL ?? 'wss://nostr-dev.wellorder.net'
//     )
//   );
//   const pubkey_auth = await fetchAuthPubkey(event?.content?.sign ?? '');
//   const pubkey_vote = await fetchVotePubkey(event?.content?.sign ?? '');
//   if (!event || !pubkey_auth || !pubkey_vote) {
//     throw new Error(`Poll id ${poll_id} not found`);
//   }
//   if (event.content.tally !== `${DOMAIN}`) {
//     throw new Error(`Poll id ${poll_id} tally domain mismatch`);
//   }
//   await prisma.savePoll(event, pubkey_auth, pubkey_vote);
//   const poll_new = (await prisma.getPoll(poll_id)) as Poll;
//   const info_new = zod_event_poll.shape.content.safeParse(poll_new?.info ?? '');
//   if (!info_new.success) throw new Error(`Bad deserialize on ${poll_id}`);
//   return { ...poll_new, info: info_new.data };
// };

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
    throw new Error(`Poll id ${poll_id} event not found`);
  }
  const info_new = parsePollContent(raw_event.content);
  const pubkey_auth = await fetchAuthPubkey(info_new?.sign ?? '');
  const pubkey_vote = await fetchVotePubkey(info_new?.sign ?? '');
  if (!pubkey_auth || !pubkey_vote) {
    throw new Error(`Poll id ${poll_id} keys not found`);
  }
  if (info_new?.tally !== `${DOMAIN}`) {
    throw new Error(`Poll id ${poll_id} tally domain mismatch`);
  }
  await savePoll(raw_event, info_new.ends, pubkey_auth, pubkey_vote);
  const poll_new = await getPoll(poll_id);
  const info_newnew = parsePollContent(poll_new?.info ?? '');
  return { ...poll_new, info: info_newnew } as Poll;
};

const base58_regex = /([1-9a-zA-Z][^OIl])*/;

export const validateVote = (poll: Poll, vote: string) => {
  const allowed_options = poll.info.choices.map((_, i) => intToBs58(i));
  if (vote === '0') return { success: true };
  if (!base58_regex.exec(vote)) return { success: false };
  return vote.split('').reduce(
    (acc, x) => {
      if (!allowed_options.includes(x)) return { ...acc, success: false };
      if (acc.cache.has(x)) return { ...acc, success: false };
      return { ...acc, cache: new Map([...acc.cache, [x, true]]) };
    },
    { success: true, cache: new Map<string, boolean>() }
  );
};

export const formatPollResults = (
  data: Map<string, number>,
  choices: string[],
  total: number,
  percent: boolean
) => {
  const results = Object.fromEntries(
    choices.map((_, i) => [intToBs58(i), data.get(intToBs58(i)) ?? 0])
  );
  return !percent || total === 0 ? results : getPollPercent(results, total);
};

export const calculatePollResults = (type: string, data: string[]) => {
  const first_round = data.reduce(
    (acc, x) => ({
      buckets: new Map([
        ...acc.buckets,
        [
          x.split('')[0],
          [
            ...(acc.buckets.get(x.split('')[0]) ?? []),
            type === 'simple' ? [''] : x.split('').slice(1),
          ],
        ],
      ]),
      total: acc.total + 1,
    }),
    { buckets: new Map<string, string[][]>(), total: 0 }
  );

  const runVoteRoundRecursive = (
    input: Map<string, string[][]>,
    total: number
  ): Map<string, number> => {
    const input_arr = Array.from(input.entries());
    const has_winner =
      input_arr.filter(([_, votes]) => votes.length >= total / 2).length === 1;

    if (has_winner) {
      return new Map(input_arr.map(([key, votes]) => [key, votes.length]));
    }

    const loser = input_arr.reduce(
      (acc, x) =>
        x[1].length < acc.loser_count
          ? { loser_id: x[0], loser_count: x[1].length }
          : acc,
      { loser_id: '', loser_count: Number.MAX_SAFE_INTEGER }
    ).loser_id;

    const new_input = (input.get(loser) ?? []).reduce(
      (acc, x) => acc.set(x[0], [...(input.get(x[0]) ?? []), x.slice(1)]),
      input
    );
    return runVoteRoundRecursive(new_input, total);
  };

  const first_results = new Map(
    Array.from(first_round.buckets.entries()).map(([key, votes]) => [
      key,
      votes.length,
    ])
  );

  if (type === 'simple') {
    return {
      results: first_results,
      total: first_round.total,
    };
  }

  if (first_round.total === 0) {
    return {
      first_round: first_results,
      results: new Map(),
      total: 0,
    };
  }

  return {
    first_round: first_results,
    results: runVoteRoundRecursive(first_round.buckets, first_round.total),
    total: first_round.total,
  };
};

export const createPollExport = (
  poll_id: string,
  pubkey_vote: string,
  pubkey_auth: string
) => {
  const archive_path = process.env.ARCHIVE_PATH
    ? path.join(process.env.ARCHIVE_PATH, poll_id)
    : path.join(homedir(), '.votestr', poll_id);
  if (!existsSync(archive_path)) {
    mkdirSync(archive_path, { recursive: true });
  }
  writeFileSync(archive_path + '/vote.pub', pubkey_vote);
  writeFileSync(archive_path + '/auth.pub', pubkey_auth);
  writeFileSync(
    archive_path + '/votes.csv',
    `nonce,choice,timestamp,unblinded_vote,unblinded_auth\n`
  );
  return archive_path;
};

export const addExportVotes = (archive_path: string, votes: any) => {
  for (const vote of votes) {
    appendFileSync(
      archive_path + '/votes.csv',
      `${vote.nonce},${vote.choice},${vote.timestamp},${vote.unblinded_vote},${vote.unblinded_auth}\n`
    );
  }
};
