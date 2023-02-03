import * as cron from 'node-cron';
import {
  getArchivablePolls,
  archivePoll,
  prunePollData,
  pruneAuthData,
} from './prisma';

const archiveEndedPolls = async () => {
  try {
    const archivable_polls = await getArchivablePolls();
    for (const poll of archivable_polls) {
      try {
        await archivePoll(poll.id);
        await prunePollData(poll.id);
        await pruneAuthData(poll.id);
      } catch (ex) {
        console.error(ex);
      }
    }
  } catch (ex) {
    console.error(ex);
  }
};

const job = cron.schedule('* * * * *', async function () {
  archiveEndedPolls();
});

console.log('starting sign worker');
