import * as bs58 from 'bs58';
import { BigInteger } from 'jsbn';
import produce from 'immer';

export const bigToBs58 = (big: any) => bs58.encode(big.toByteArray());

export const bs58ToBig = (bs: string) => new BigInteger(bs58.decode(bs));

export const intToBs58 = (int: number) => bs58.encode(new Uint8Array([int]));

export const bs58ToInt = (bs: string) => bs58.decode(bs)[0];

export const getLocalISOString = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const isoString = new Date(date.getTime() - offset * 60 * 1000).toISOString();
  return isoString.split(':').slice(0, 2).join(':');
};

export const group = (array: any[], n: number) =>
  [...Array(Math.ceil(array.length / n))].map((el, i) =>
    array.slice(i * n, (i + 1) * n)
  );

export const timeout = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const reduceImmer = (
  fn: (acc: any, x: any, i: number) => any,
  init: any,
  arr: any[]
) =>
  arr.reduce(
    (acc, x, i) => produce(acc, (draft: any) => fn(draft, x, i)),
    init
  );

export const getPollPercent = (
  results: { [_: string]: number },
  total: number
): { [_: string]: number } =>
  reduceImmer(
    (acc, x, i) => {
      const [key, value] = x;
      if (total === 0) return void (acc.results[key] = 0);
      const percent =
        i === Object.keys(results).length
          ? 100 - acc.sum + value
          : Math.round((value / total) * 100);
      acc.sum += value;
      acc.results[key] = percent;
      return acc;
    },
    { sum: 0, results: {} as { [_: string]: number } },
    Object.entries(results)
  ).results;

export const getLocalString = (date: Date) =>
  `${date.toLocaleDateString()} ${date
    .toLocaleTimeString(undefined, { hour12: false })
    .split(':')
    .slice(0, 2)
    .join(':')}`;

export default {
  bigToBs58,
  bs58ToBig,
  intToBs58,
  bs58ToInt,
  getLocalISOString,
  group,
  timeout,
};
