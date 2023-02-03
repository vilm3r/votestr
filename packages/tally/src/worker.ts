import * as cron from 'node-cron';
import {
  getRunningPolls,
  getArchivablePolls,
  getVotes,
  updateCachedResults,
  archivePoll,
  pruneVoteData,
  getVotesCursor,
} from './prisma';
import {
  addExportVotes,
  calculatePollResults,
  createPollExport,
  formatPollResults,
} from './utils';

const updateCached = async (poll: any) => {
  const votes = await getVotes(poll.id);
  const tmp = calculatePollResults(poll.info.options.type, votes);
  const results = formatPollResults(
    tmp.results,
    poll.info.choices,
    tmp.total,
    poll.info.options.percent
  );
  const first_round = tmp.first_round
    ? {
        first_round: formatPollResults(
          tmp.first_round,
          poll.info.choices,
          tmp.total,
          poll.info.options.percent
        ),
      }
    : {};
  await updateCachedResults(
    poll.id,
    JSON.stringify({
      total: tmp.total,
      results,
      ...first_round,
    })
  );
};

const saveVoteDataToDisk = async (
  poll: any,
  archive_path: string,
  cursor?: number
): Promise<void> => {
  const votes = await getVotesCursor(poll.id, cursor);
  addExportVotes(archive_path, votes);
  const last = votes[499];
  return last != undefined
    ? saveVoteDataToDisk(poll, archive_path, last.id)
    : undefined;
};

const cacheResults = async () => {
  try {
    const running_polls = await getRunningPolls();
    for (const poll of running_polls) {
      try {
        await updateCached(poll);
      } catch (ex) {
        console.error(ex);
      }
    }
  } catch (ex) {
    console.error(ex);
  }
};

const archiveEndedPolls = async () => {
  try {
    const archivable_polls = await getArchivablePolls();
    for (const poll of archivable_polls) {
      try {
        await archivePoll(poll.id);
        await updateCached(poll);
        const archive_path = createPollExport(
          poll.id,
          poll.pubkey_vote,
          poll.pubkey_vote
        );
        await saveVoteDataToDisk(poll, archive_path);
        await pruneVoteData(poll.id);
      } catch (ex) {
        console.error(ex);
      }
    }
  } catch (ex) {
    console.error(ex);
  }
};

const job = cron.schedule('* * * * *', async function () {
  try {
    await cacheResults();
    await archiveEndedPolls();
  } catch (ex) {
    console.error(ex);
  }
});

console.log('starting tally worker');
