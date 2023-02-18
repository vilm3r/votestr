import * as nostr from '@votestr-libs/nostr';

describe('Poll info serialize and deserialize', () => {
  test('it should return serialize', () => {
    const input = {
      title: 'test',
      choices: ['1', '2'],
      ends: '2023-02-06T00:00:00.000Z',
      tally: 'http://localhost:3334',
      sign: 'http://localhost:3333',
      options: {
        type: 'simple' as 'simple',
        percent: true,
        randomize: true,
        secret: false,
        show_creator: true,
        show_results: 'after-poll' as 'after-poll',
        modify_minutes: 0,
      },
    };

    const output =
      'http://localhost:3334|http://localhost:3333|test|2023-02-06T00:00:00.000Z|1^2|simple|0|1|1|0|1|after-poll';

    expect(nostr.serializePoll(input)).toEqual(output);
  });

  test('it should return serialize with escaped characters', () => {
    const input = {
      title: 'test',
      choices: ['|', '~'],
      ends: '2023-02-06T00:00:00.000Z',
      tally: 'http://localhost:3334',
      sign: 'http://localhost:3333',
      options: {
        type: 'simple' as 'simple',
        percent: true,
        randomize: true,
        secret: false,
        show_creator: true,
        show_results: 'after-poll' as 'after-poll',
        modify_minutes: 0,
      },
    };

    const output =
      'http://localhost:3334|http://localhost:3333|test|2023-02-06T00:00:00.000Z|\\~^~|simple|0|1|1|0|1|after-poll';

    expect(nostr.serializePoll(input)).toEqual(output);
  });

  test('it should return full deserialize', () => {
    const input =
      'http://localhost:3334|http://localhost:3333|test|2023-02-06T00:00:00.000Z|1^2|simple|0|1|1|0|1|after-poll';

    const output = {
      title: 'test',
      choices: ['1', '2'],
      ends: '2023-02-06T00:00:00.000Z',
      tally: 'http://localhost:3334',
      sign: 'http://localhost:3333',
      options: {
        type: 'simple' as 'simple',
        percent: true,
        randomize: true,
        secret: false,
        show_creator: true,
        show_results: 'after-poll' as 'after-poll',
        modify_minutes: 0,
      },
    };

    expect(nostr.deserializePoll(input)).toEqual(output);
  });

  test('it should return partial deserialize', () => {
    const input =
      'http://localhost:3334|http://localhost:3333|test|2023-02-06T00:00:00.000Z|1^2';

    const output = {
      title: 'test',
      choices: ['1', '2'],
      ends: '2023-02-06T00:00:00.000Z',
      tally: 'http://localhost:3334',
      sign: 'http://localhost:3333',
      options: {
        type: undefined,
        percent: undefined,
        randomize: undefined,
        secret: undefined,
        show_creator: undefined,
        show_results: undefined,
        modify_minutes: undefined,
      },
    };

    expect(nostr.deserializePoll(input)).toEqual(output);
  });

  test('it should return deserialize with escaped characters', () => {
    const input =
      'http://localhost:3334|http://localhost:3333|test|2023-02-06T00:00:00.000Z|\\~^~|simple|0|1|1|0|1|after-poll';

    const output = {
      title: 'test',
      choices: ['|', '~'],
      ends: '2023-02-06T00:00:00.000Z',
      tally: 'http://localhost:3334',
      sign: 'http://localhost:3333',
      options: {
        type: 'simple' as 'simple',
        percent: true,
        randomize: true,
        secret: false,
        show_creator: true,
        show_results: 'after-poll' as 'after-poll',
        modify_minutes: 0,
      },
    };

    expect(nostr.deserializePoll(input)).toEqual(output);
  });
});
