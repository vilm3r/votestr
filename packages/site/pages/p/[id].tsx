import {
  bech32ToHex,
  EventPoll,
  getAuthPayloadReq,
  getAuthSignReq,
  getAuthVoteReq,
  getPollCreator,
  getPollEvent,
  getVoteReq,
  getVoteResultsReq,
  parseCreator,
  parsePollEvent,
} from '@votestr-libs/nostr';
import { bigToBs58, bs58ToBig, timeout } from '@votestr-libs/utils';
import 'websocket-polyfill';
import { useEffect, useRef, useState } from 'react';
import {
  Event,
  generatePrivateKey,
  getEventHash,
  getPublicKey,
  signEvent,
} from 'nostr-tools';
import { InferGetServerSidePropsType } from 'next';
import * as BlindSignature from 'blind-signatures';
import * as NodeRSA from 'node-rsa';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import PollCreator from '../../components/PollCreator';
import Link from 'next/link';
import Header from '../../components/Header';
import ExtensionWarning from '../../components/ExtensionWarning';
import VoteResultsRanked from '../../components/VoteResultsRanked';
import VoteResultsSimple from '../../components/VoteResultsSimple';

const getVote = async (poll_id: string, tally: string) =>
  (
    await fetch(`${tally}/api/poll/${poll_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accepts: 'application/json',
      },
    })
  ).json();

const sendVote = async (poll_id: string, tally: string, event: Event) =>
  (
    await fetch(`${tally}/api/poll/${poll_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accepts: 'application/json',
      },
      body: JSON.stringify(event),
    })
  ).json();

const sendAuth = async (poll_id: string, sign: string, event: Event) => {
  try {
    return await (
      await fetch(`${sign}/api/poll/${poll_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accepts: 'application/json',
        },
        body: JSON.stringify(event),
      })
    ).json();
  } catch (ex) {
    console.error(ex);
  }
};

const getSignAuthPubkey = async (sign: string) =>
  new NodeRSA(
    await (
      await fetch(`${sign}/auth.key`, {
        method: 'GET',
      })
    ).text()
  );
const getSignVotePubkey = async (sign: string) =>
  new NodeRSA(
    await (
      await fetch(`${sign}/vote.key`, {
        method: 'GET',
      })
    ).text()
  );

export const getServerSideProps: any = async (
  ctx: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
  const relay_url =
    process.env.NEXT_PUBLIC_RELAY_ENDPOINT ?? 'wss://nostr-dev.wellorder.net';
  const poll = parsePollEvent(
    await getPollEvent(bech32ToHex(ctx.params?.id), relay_url)
  );
  const creator = poll
    ? await parseCreator(
        await getPollCreator(poll?.pubkey ?? '', relay_url),
        poll.pubkey
      )
    : undefined;
  const cache_age = poll ? 3600 : 0;
  ctx.res.setHeader(
    'Cache-Control',
    `s-maxage=${cache_age}, stale-while-revalidate=${cache_age}`
  );
  const props = {
    ...(poll?.id && { poll }),
    ...(creator?.pubkey && { creator }),
  };
  return { props };
};

const DynamicVoteChoiceRanked = dynamic(
  () => import('../../components/VoteChoiceRanked'),
  {
    ssr: false,
    loading: () => <></>,
  }
);

const DynamicVoteChoiceSimple = dynamic(
  () => import('../../components/VoteChoiceSimple'),
  {
    ssr: false,
    loading: () => <></>,
  }
);

const waitForNostr = async (wait: number): Promise<void> => {
  if ((window as any).nostr || wait === 0) return;
  await timeout(50);
  return await waitForNostr(wait - 50);
};

export type TallyDataType = {
  results?: { [_: string]: number };
  total?: number;
  first_round?: { [_: string]: number };
  choice?: string;
  created_at?: string;
};

type nostrRef = {
  pub?: string;
  nonce?: string;
  signed_auth?: string;
  sign_auth_key?: typeof NodeRSA;
  sign_vote_key?: typeof NodeRSA;
};

type PollPageProps = {
  poll: EventPoll;
  creator: { name: string; picture: string };
};

export function PollPage({ poll, creator }: PollPageProps) {
  const nostr = useRef<nostrRef>({
    pub: undefined,
    nonce: undefined,
    signed_auth: undefined,
    sign_auth_key: undefined,
    sign_vote_key: undefined,
  });
  const [tally_data, setTallyData] = useState<TallyDataType>({
    results: undefined,
    first_round: undefined,
    choice: undefined,
    created_at: undefined,
    total: undefined,
  });
  const [show_extension_warning, setShowExtensionWarning] = useState(false);

  useEffect(() => {
    (async () => {
      await waitForNostr(300);
      switch (true) {
        // prompt user to install extension
        case !(window as any).nostr &&
          new Date(poll.content.ends).getTime() > Date.now(): {
          console.log('poll valid no extension');
          return setShowExtensionWarning(true);
        }
        // poll has ended so just show results
        case !(window as any).nostr &&
          new Date(poll.content.ends).getTime() < Date.now(): {
          const results = await getVote(poll.id, poll.content.tally);
          return setTallyData((_) => results);
        }
        // normal auth flow
        default: {
          try {
            await (window as any).nostr.enable();
          } catch (ex) {
            // suppress error in case nos2x
          }
          const pub = await (window as any).nostr.getPublicKey();
          const sign_auth_key = await getSignAuthPubkey(poll.content.sign);
          const sign_vote_key = await getSignVotePubkey(poll.content.sign);
          const nonce_req = getAuthPayloadReq(pub, poll.id);
          const id = getEventHash(nonce_req);
          const nonce_sig = await (window as any).nostr.signEvent({
            ...nonce_req,
            id,
          });
          const auth_res = await sendAuth(
            poll.id,
            poll.content.sign,
            nonce_sig
          );
          // we haven't voted yet
          if (!auth_res?.payload) {
            if (new Date(poll.content.ends).getTime() > Date.now()) {
              return (nostr.current = {
                ...nostr.current,
                pub,
                sign_auth_key,
                sign_vote_key,
              });
            }
            // poll has ended
            const results = await getVote(poll.id, poll.content.tally);
            return setTallyData((_) => results);
          }
          const saved = JSON.parse(
            await (window as any).nostr.nip04.decrypt(pub, auth_res.payload)
          );
          const anon_priv = generatePrivateKey();
          const anon_pub = getPublicKey(anon_priv);
          const vote_req = getVoteResultsReq(anon_pub, saved.nonce, poll.id);
          const event = {
            ...vote_req,
            id: getEventHash(vote_req),
            sig: signEvent(vote_req, anon_priv),
          };
          const results = await sendVote(poll.id, poll.content.tally, event);
          nostr.current = {
            ...nostr.current,
            pub,
            nonce: saved.nonce,
            sign_auth_key,
            sign_vote_key,
          };
          setTallyData((_) => results);
        }
      }
    })();
  }, [poll]);

  async function clickVote(choice: string) {
    if (!(window as any).nostr) return setShowExtensionWarning(true);
    let sig_event;
    let vote;
    const timestamp = new Date().toISOString();
    if (!nostr.current.nonce) {
      const nonce = generatePrivateKey();
      nostr.current.nonce = nonce;
      const auth = BlindSignature.blind({
        message: JSON.stringify({
          poll_id: poll.id,
          nonce,
        }),
        N: nostr.current.sign_auth_key.keyPair.n.toString(),
        E: nostr.current.sign_auth_key.keyPair.e.toString(),
      });
      vote = BlindSignature.blind({
        message: JSON.stringify({
          poll_id: poll.id,
          nonce,
          choice,
          timestamp,
        }),
        N: nostr.current.sign_vote_key.keyPair.n.toString(),
        E: nostr.current.sign_vote_key.keyPair.e.toString(),
      });
      const payload = await (window as any).nostr.nip04.encrypt(
        nostr.current.pub,
        JSON.stringify({
          r: bigToBs58(auth.r),
          nonce,
        })
      );
      const req = getAuthSignReq(
        nostr.current.pub as string,
        poll.id,
        bigToBs58(auth.blinded),
        bigToBs58(vote.blinded),
        payload
      );
      const id = getEventHash(req);
      sig_event = await (window as any).nostr.signEvent({
        ...req,
        id,
      });
    } else {
      vote = BlindSignature.blind({
        message: JSON.stringify({
          poll_id: poll.id,
          nonce: nostr.current.nonce,
          choice,
          timestamp,
        }),
        N: nostr.current.sign_vote_key.keyPair.n.toString(),
        E: nostr.current.sign_vote_key.keyPair.e.toString(),
      });
      const req = getAuthVoteReq(
        nostr.current.pub as string,
        poll.id,
        bigToBs58(vote.blinded)
      );
      const id = getEventHash(req);
      sig_event = await (window as any).nostr.signEvent({
        ...req,
        id,
      });
    }
    const auth = await sendAuth(poll.id, poll.content.sign, sig_event);
    const saved = JSON.parse(
      await (window as any).nostr.nip04.decrypt(nostr.current.pub, auth.payload)
    );

    const unblinded_auth = BlindSignature.unblind({
      signed: bs58ToBig(auth.signed_auth),
      N: nostr.current.sign_auth_key.keyPair.n.toString(),
      r: bs58ToBig(saved.r),
    });
    const unblinded_vote = BlindSignature.unblind({
      signed: bs58ToBig(auth.signed_vote),
      N: nostr.current.sign_vote_key.keyPair.n.toString(),
      r: vote.r,
    });
    const anon_priv = generatePrivateKey();
    const anon_pub = getPublicKey(anon_priv);
    const req = getVoteReq(
      anon_pub,
      poll.id,
      saved.nonce,
      bigToBs58(unblinded_auth),
      bigToBs58(unblinded_vote),
      timestamp,
      choice
    );
    const event = {
      ...req,
      id: getEventHash(req),
      sig: signEvent(req, anon_priv),
    };
    try {
      const results = await sendVote(poll.id, poll.content.tally, event);
      return setTallyData((prev) => ({
        ...prev,
        results: results?.results ?? prev?.results,
        choice: results?.choice ?? prev?.choice,
        total: results?.total ?? prev?.total,
        created_at: results?.created_at ?? prev?.created_at,
      }));
    } catch (ex) {
      console.error(ex);
    }
  }

  return (
    <div>
      <Head>
        <title>{`Votestr | ${poll.content.title}`}</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="description" content={`${poll.content.title}`}></meta>
      </Head>
      <Header />
      <ExtensionWarning
        open={show_extension_warning}
        handleClose={() => setShowExtensionWarning(false)}
      />
      <div className="m-auto max-w-3xl p-10">
        <div>
          {poll.content.options.show_creator && (
            <PollCreator creator={creator} />
          )}
          <h1 className="pb-5 text-3xl font-bold">{poll.content.title}</h1>
        </div>
        {poll.content.options.type === 'ranked' && (
          <>
            <div
              className={`${
                tally_data.results ||
                Date.now() > new Date(poll.content.ends).getTime()
                  ? 'hidden'
                  : 'block'
              }`}
            >
              <DynamicVoteChoiceRanked
                poll={poll}
                onClickVote={(choice: string) => clickVote(choice)}
              />
            </div>
            <div
              className={`${
                tally_data.results ||
                Date.now() > new Date(poll.content.ends).getTime()
                  ? 'block'
                  : 'hidden'
              }`}
            >
              <VoteResultsRanked
                poll={poll}
                tally_data={tally_data}
                onClickRevote={() => {
                  setTallyData((prev) => ({
                    ...prev,
                    results: undefined,
                  }));
                }}
              />
            </div>
          </>
        )}
        {poll.content.options.type === 'simple' && (
          <>
            <div
              className={`${
                tally_data.results ||
                Date.now() > new Date(poll.content.ends).getTime()
                  ? 'hidden'
                  : 'block'
              }`}
            >
              <DynamicVoteChoiceSimple
                poll={poll}
                onClickVote={(choice: string) => clickVote(choice)}
              />
            </div>
            <div
              className={`${
                tally_data.results ||
                Date.now() > new Date(poll.content.ends).getTime()
                  ? 'block'
                  : 'hidden'
              }`}
            >
              <VoteResultsSimple
                poll={poll}
                tally_data={tally_data}
                onClickRevote={() => {
                  setTallyData((prev) => ({
                    ...prev,
                    results: undefined,
                  }));
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const NotFoundPage = () => (
  <>
    <Head>
      <title>Votestr</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <meta
        name="description"
        content="Create your next poll on Nostr with Votestr!"
      ></meta>
    </Head>
    <Header show_create_cta={false} />
    <div className="px-4 pt-20">
      <div className="text-center">
        <h1 className="text-9xl font-black text-gray-200">404</h1>
        <p className="text-2xl font-bold tracking-tight sm:text-4xl">Uh-oh!</p>
        <p className="mt-4 text-gray-500">We can&apos;t find that poll.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring"
        >
          Create your own poll
        </Link>
      </div>
    </div>
  </>
);

const Index = ({ poll, creator }: PollPageProps) =>
  poll?.id ? <PollPage poll={poll} creator={creator} /> : <NotFoundPage />;

export default Index;