import * as express from 'express';
import * as cors from 'cors';
import { validateEvent, verifySignature } from 'nostr-tools';
import { zod_event, zod_event_tally_req } from '@votestr-libs/nostr';
import { get, cast } from './vote';
import { getOrFetchPollData } from './utils';

const app = express();
app.use(express.json());
app.use(cors());

app.get('/api/poll/:poll_id', async (req, res) => {
  try {
    const poll_id = req?.params?.poll_id;
    const valid = zod_event.shape.id.safeParse(poll_id);
    if (!valid.success) return res.status(400).send();
    const poll = await getOrFetchPollData(poll_id);
    if (!poll) return res.status(404).send();
    return await get(poll, res);
  } catch (ex) {
    res.status(500).send();
  }
});

app.post('/api/poll/:poll_id', async (req, res) => {
  try {
    const poll_id = req?.params?.poll_id;
    const is_ok = validateEvent(req.body) && verifySignature(req.body);
    const event = { ...req.body, content: JSON.parse(req.body.content) };
    const valid_req = zod_event_tally_req.safeParse(event);
    const valid_id = zod_event_tally_req.shape.id.safeParse(poll_id);

    if (!is_ok || !valid_req.success || !valid_id.success)
      return res.status(400).send();
    const poll = await getOrFetchPollData(poll_id);
    if (!poll) return res.status(404).send();
    return await cast(poll, event, res);
  } catch (ex) {
    console.warn(ex);
    res.status(500).send();
  }
});

const port = process.env.port || 3334;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
