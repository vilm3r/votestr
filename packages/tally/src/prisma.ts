import { PrismaClient, Prisma } from '@prisma/client-tally';
import { EventPoll, EventPollInfo } from '@votestr-libs/nostr';

const prisma = new PrismaClient();

export const getPoll = (poll_id: string) =>
  prisma.poll
    .findFirst({
      select: {
        id: true,
        info: true,
        ends: true,
        archived: true,
        pubkey: true,
        pubkey_auth: true,
        pubkey_vote: true,
      },
      where: {
        id: poll_id,
      },
    })
    .then((x) => (x ? { ...x, info: JSON.parse(x.info) } : undefined));

export const getVote = (nonce: string, poll_id: string) =>
  prisma.vote.findFirst({
    select: {
      choice: true,
      created_at: true,
    },
    where: {
      poll_id,
      nonce,
    },
  });

export const getVotes = (poll_id: string) =>
  prisma.vote
    .findMany({
      select: {
        choice: true,
      },
      where: {
        poll_id,
        NOT: {
          choice: {
            equals: '0',
          },
        },
      },
    })
    .then((votes) => votes.map(({ choice }) => choice));

export const getVotesCursor = (poll_id: string, cursor?: number) =>
  prisma.vote.findMany({
    take: 500,
    ...(cursor != undefined && { skip: 1 }),
    ...(cursor != undefined && {
      cursor: {
        id: cursor,
      },
    }),
    where: {
      poll_id,
    },
    orderBy: {
      id: 'asc',
    },
  });

export const getVoteCount = (poll_id: string) =>
  prisma.vote.count({
    where: {
      poll_id,
    },
  });

export const castVote = (
  poll_id: string,
  nonce: string,
  choice: string,
  unblinded_auth: string,
  unblinded_vote: string,
  timestamp: string
) =>
  prisma.vote.upsert({
    where: {
      nonce_poll_id: {
        poll_id,
        nonce,
      },
    },
    update: {
      choice,
      unblinded_vote,
      timestamp,
    },
    create: {
      poll_id,
      nonce,
      choice,
      unblinded_auth,
      unblinded_vote,
      timestamp,
    },
  });

export const addPollPubkeys = (
  poll_id: string,
  pubkey_auth: string,
  pubkey_vote: string
) =>
  prisma.poll.update({
    data: {
      pubkey_auth,
      pubkey_vote,
    },
    where: {
      id: poll_id,
    },
  });

export const savePoll = (
  poll: EventPoll,
  pubkey_auth: string,
  pubkey_vote: string
) =>
  prisma.poll.create({
    data: {
      id: poll.id,
      pubkey: poll.pubkey,
      info: JSON.stringify(poll.content),
      ends: poll.content.ends,
      pubkey_auth,
      pubkey_vote,
    },
  });

export const getCachedResults = (poll_id: string) =>
  prisma.poll
    .findFirst({
      select: {
        results: true,
      },
      where: {
        id: poll_id,
      },
    })
    .then((x) => JSON.parse(x?.results ?? '{}'));

export const updateCachedResults = (poll_id: string, results: string) =>
  prisma.poll.update({
    data: {
      results,
    },
    where: {
      id: poll_id,
    },
  });

export const getRunningPolls = () =>
  prisma.poll
    .findMany({
      select: {
        id: true,
        info: true,
        ends: true,
        results: true,
      },
      where: {
        ends: {
          gte: new Date().toISOString(),
        },
      },
    })
    .then((polls) =>
      polls.map((poll) => ({
        ...poll,
        info: JSON.parse(poll.info) as EventPollInfo,
      }))
    );

export const getArchivablePolls = () =>
  prisma.poll
    .findMany({
      select: {
        id: true,
        info: true,
        ends: true,
        pubkey_vote: true,
      },
      where: {
        ends: {
          lte: new Date().toISOString(),
        },
        archived: {
          equals: false,
        },
      },
    })
    .then((polls) =>
      polls.map((poll) => ({
        ...poll,
        info: JSON.parse(poll.info) as EventPollInfo,
      }))
    );

export const archivePoll = (poll_id: string) =>
  prisma.poll.update({
    data: {
      archived: true,
    },
    where: {
      id: poll_id,
    },
  });

export const pruneVoteData = (poll_id: string) =>
  prisma.vote.updateMany({
    data: {
      unblinded_auth: undefined,
      unblinded_vote: undefined,
      timestamp: undefined,
    },
    where: {
      poll_id,
    },
  });

export const prunePollData = (poll_id: string) =>
  prisma.vote.updateMany({
    data: {
      unblinded_vote: undefined,
      timestamp: undefined,
    },
    where: {
      poll_id,
    },
  });

export default {
  getPoll,
  getArchivablePolls,
  getRunningPolls,
  castVote,
  savePoll,
  getVoteCount,
  getVotes,
  getCachedResults,
  getVote,
  getVotesCursor,
};
