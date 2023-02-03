import * as express from 'express';
import * as cors from 'cors';
import 'websocket-polyfill';
import { validateEvent, verifySignature } from 'nostr-tools';
import { EventSignReq, zod_event_sign_req } from '@votestr-libs/nostr';
import { sign } from './sign';
import { getBlindSignKeys, getOrFetchPollData } from './utils';

const app = express();
app.use(express.json());
app.use(cors());

const keys = getBlindSignKeys();
const keys_pub = Object.fromEntries(
  Object.entries(keys).map(([key, value]) => [
    key,
    value.exportKey('pkcs8-public-pem'),
  ])
);

app.post('/api/poll/:poll_id', async (req, res) => {
  try {
    const poll_id = req?.params?.poll_id;
    const is_ok = validateEvent(req.body) && verifySignature(req.body);
    const event = {
      ...req.body,
      content: JSON.parse(req.body.content),
    } as EventSignReq;
    const valid_req = zod_event_sign_req.safeParse(event);
    const valid_id = zod_event_sign_req.shape.id.safeParse(poll_id);
    if (!is_ok || !valid_req.success || !valid_id.success)
      return res.status(400).send();
    const poll = await getOrFetchPollData(poll_id);
    if (!poll) return res.status(404).send();

    return await sign(event, poll, res);
  } catch (e) {
    console.error(e);
    res.status(500).send();
  }
});

app.get('/auth.key', (_, res) => res.status(200).send(keys_pub.auth));
app.get('/vote.key', (_, res) => res.status(200).send(keys_pub.vote));

const port = process.env.port || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
