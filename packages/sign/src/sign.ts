import * as BlindSignature from 'blind-signatures';
import { EventSignReq } from '@votestr-libs/nostr';
import { getAuth, saveAuth } from './prisma';
import { getBlindSignKeys, Poll, bigToBs58, bs58ToBig } from './utils';
import { Response } from 'express';

const keys = getBlindSignKeys();

export const sign = async (event: EventSignReq, poll: Poll, res: Response) => {
  const auth_existing = await getAuth(event.pubkey, poll.id);

  switch (event.content.type) {
    case 'payload': {
      if (!auth_existing) return res.status(403).send();
      return res.status(200).send({
        payload: auth_existing?.payload,
      });
    }
    case 'vote': {
      if (!auth_existing || poll.ends.getTime() < Date.now())
        return res.status(403).send();
      const signed_vote = BlindSignature.sign({
        blinded: bs58ToBig(event.content.blinded_vote),
        key: keys.vote,
      });
      return res.status(200).send({
        signed_auth: auth_existing?.signed_auth,
        signed_vote: bigToBs58(signed_vote),
        payload: auth_existing?.payload,
      });
    }
    case 'auth': {
      if (auth_existing || poll.ends.getTime() < Date.now())
        return res.status(403).send();
      const signed_auth = bigToBs58(
        BlindSignature.sign({
          blinded: bs58ToBig(event.content?.blinded_auth),
          key: keys.auth,
        })
      );
      const signed_vote = bigToBs58(
        BlindSignature.sign({
          blinded: bs58ToBig(event.content.blinded_vote),
          key: keys.vote,
        })
      );
      const new_auth = await saveAuth(event, signed_auth, poll.id);
      return res.status(200).send({
        signed_auth,
        signed_vote,
        payload: new_auth.payload,
      });
    }
    default: {
      res.status(500).send();
    }
  }
};
