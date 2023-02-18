import { PrismaClient, Prisma } from '@prisma/client-sign';
import { EventPollInfo, EventSignReq } from '@votestr-libs/nostr';
import { Event } from 'nostr-tools';

const prisma = new PrismaClient();

export const saveAuth = async (
  event: EventSignReq,
  signed_auth: string,
  poll_id: string
) =>
  prisma.auth.create({
    data: {
      signed_auth,
      pubkey: event.pubkey,
      payload: event.content.type === 'auth' ? event.content.payload : '',
      poll_id,
    },
  });

export const getAuth = async (pubkey: string, poll_id: string) =>
  prisma.auth.findFirst({
    where: {
      poll_id,
      pubkey,
    },
  });

export const getPoll = (poll_id: string) =>
  prisma.poll
    .findFirst({
      select: {
        id: true,
        info: true,
        ends: true,
        pubkey: true,
      },
      where: {
        id: poll_id,
      },
    })
    .then();

export const savePoll = (poll: Event, ends: string) =>
  prisma.poll.create({
    data: {
      id: poll.id as string,
      pubkey: poll.pubkey,
      info: poll.content,
      ends,
    },
  });

export const getArchivablePolls = () =>
  prisma.poll.findMany({
    select: {
      id: true,
      info: true,
      ends: true,
    },
    where: {
      ends: {
        lte: new Date().toISOString(),
      },
      archived: {
        equals: false,
      },
    },
  });

export const prunePollData = (poll_id: string) =>
  prisma.poll.updateMany({
    data: {
      info: undefined,
      ends: undefined,
    },
    where: {
      id: poll_id,
    },
  });

export const pruneAuthData = (poll_id: string) =>
  prisma.auth.updateMany({
    data: {
      signed_auth: undefined,
    },
    where: {
      poll_id,
    },
  });

export const archivePoll = (poll_id: string) =>
  prisma.poll.update({
    data: {
      archived: true,
    },
    where: {
      id: poll_id,
    },
  });
