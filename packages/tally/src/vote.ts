import * as BlindSignature from 'blind-signatures';
import {
  formatPollResults,
  calculatePollResults,
  Poll,
  validateVote,
} from './utils';
import prisma, { getVote } from './prisma';
import { EventTallyReq } from '@votestr-libs/nostr';
import * as NodeRSA from 'node-rsa';
import { Response } from 'express';
import { bs58ToBig, intToBs58 } from '@votestr-libs/utils';

const VOTE_CACHE_THRESHOLD = process.env.VOTE_CACHE_THRESHOLD
  ? parseInt(process.env.VOTE_CACHE_THRESHOLD)
  : 50;

const getVoteResults = async (poll: Poll) => {
  const count = await prisma.getVoteCount(poll.id);
  if (count === 0)
    return {
      results: Object.fromEntries(
        poll.info.choices.map((_, i) => [intToBs58(i), 0])
      ),
      total: 0,
    };

  const cached = await prisma.getCachedResults(poll.id);

  if (
    cached.results != undefined &&
    (count > VOTE_CACHE_THRESHOLD || poll.archived)
  ) {
    return cached;
  }
  const votes = await prisma.getVotes(poll.id);
  const tmp = calculatePollResults(poll.info.options.type, votes);
  return {
    total: tmp.total,
    results: formatPollResults(
      tmp.results,
      poll.info.choices,
      tmp.total,
      poll.info.options.percent
    ),
    ...(tmp.first_round
      ? {
          first_round: formatPollResults(
            tmp.first_round,
            poll.info.choices,
            tmp.total,
            poll.info.options.percent
          ),
        }
      : {}),
  };
};

export const get = async (poll: Poll, res: Response) => {
  const results = await getVoteResults(poll);
  return res.send(results);
};

export const cast = async (poll: Poll, event: EventTallyReq, res: Response) => {
  const vote = await prisma.getVote(event.content.nonce, poll.id);
  const poll_end_time = new Date(poll.info.ends).getTime();

  switch (event.content.type) {
    case 'results': {
      if (Date.now() < poll_end_time && (!vote || poll.info.options.secret)) {
        return res.status(403).send();
      }
      const results = await getVoteResults(poll);

      return res.send({
        ...results,
        choice: vote?.choice,
        created_at: vote?.created_at,
      });
    }
    case 'vote': {
      if (!validateVote(poll, event.content.choice).success)
        return res.status(401).send();

      const timestamp = new Date(event.content.timestamp).getTime();
      // check if poll is open, timestamp is recent and before vote end
      if (
        Date.now() > poll_end_time ||
        timestamp > Date.now() + 120000 ||
        timestamp > poll_end_time
      ) {
        console.error('timestamp issue');
        return res.status(401).send();
      }

      const pubkey_auth = new NodeRSA(
        poll.pubkey_auth,
        'pkcs8-public',
        undefined
      );
      const pubkey_vote = new NodeRSA(
        poll.pubkey_vote,
        'pkcs8-public',
        undefined
      );

      if (!pubkey_auth?.keyPair || !pubkey_vote?.keyPair)
        return res.status(500).send();

      const verify_auth = BlindSignature.verify({
        unblinded: bs58ToBig(event.content.unblinded_auth),
        N: pubkey_auth.keyPair.n.toString(),
        E: pubkey_auth.keyPair.e.toString(),
        message: JSON.stringify({
          poll_id: event.content.poll_id,
          nonce: event.content.nonce,
        }),
      });
      const verify_vote = BlindSignature.verify({
        unblinded: bs58ToBig(event.content.unblinded_vote),
        N: pubkey_vote.keyPair.n.toString(),
        E: pubkey_vote.keyPair.e.toString(),
        message: JSON.stringify({
          poll_id: event.content.poll_id,
          nonce: event.content.nonce,
          choice: event.content.choice,
          timestamp: event.content.timestamp,
        }),
      });
      if (!verify_auth || !verify_vote) {
        if (!verify_auth) console.error('bad auth signing');
        if (!verify_vote) console.error('bad vote signing');
        return res.status(401).send();
      }
      // check if allowed to modify vote
      if (
        vote &&
        event.content.choice != undefined &&
        poll.info.options.modify_minutes != -1 &&
        vote.created_at.getTime() + poll.info.options.modify_minutes * 60000 <
          Date.now()
      ) {
        return res.status(403).send();
      }

      await prisma.castVote(
        poll.id,
        event.content.nonce,
        event.content.choice,
        event.content.unblinded_auth,
        event.content.unblinded_vote,
        event.content.timestamp
      );

      const new_vote = await getVote(
        event.content.nonce,
        event.content.poll_id
      );

      // hide secret poll results until after the poll ends
      if (poll.info.options.secret && new Date(Date.now()) < poll.ends)
        return res.send({
          choice: new_vote?.choice ?? vote?.choice,
          created_at: new_vote?.created_at ?? vote?.created_at,
        });

      const results = await getVoteResults(poll);

      return res.send({
        ...results,
        choice: new_vote?.choice ?? vote?.choice,
        created_at: new_vote?.created_at ?? vote?.created_at,
      });
    }
    default:
      return res.status(400).send();
  }
};
