import * as utils from '@votestr-libs/utils';

describe('Covert vote numbers to percent', () => {
  test('it should return vote results as percents', () => {
    const input: [any, number] = [{ '1': 100, '2': 50 }, 150];

    const output = { '1': 67, '2': 33 };

    expect(utils.getPollPercent(...input)).toEqual(output);
  });

  test('it should handle 0 total votes', () => {
    const input: [any, number] = [{ '1': 0, '2': 0 }, 0];

    const output = { '1': 0, '2': 0 };

    expect(utils.getPollPercent(...input)).toEqual(output);
  });

  test('it should handle one-sided votes', () => {
    const input: [any, number] = [{ '1': 1, '2': 0 }, 1];

    const output = { '1': 100, '2': 0 };

    expect(utils.getPollPercent(...input)).toEqual(output);
  });
});
