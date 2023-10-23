import { expect, test } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

export const testDirectory = './test.d/';

interface TestTarCase {
  filename: string;
  tarFilePath: string;
  expectedFiles: [string, number, string][];
}

export function listTestTarCases(): TestTarCase[] {
  const testCases: TestTarCase[] = [];

  fs.readdirSync(testDirectory).forEach(filename => {
    if (path.extname(filename) !== '.tar') {
      return;
    }

    const basename = path.basename(filename, '.tar');
    testCases.push({
      filename,
      tarFilePath: path.join(testDirectory, filename),
      expectedFiles: loadJSON(path.join(testDirectory, `${basename}.contents.json`)),
    });
  });

  return testCases;
}

function loadJSON(file: string): any {
  const buf = fs.readFileSync(file);
  const exp = JSON.parse(buf.toString('utf-8'));
  return exp;
}

export function toPrintableString(buffer) {
  const printableChars = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

  let result = '';
  for (let i = 0; i < buffer.length; i++) {
    const char = buffer.toString('utf8', i, i + 1);
    if (printableChars.includes(char)) {
      result += char;
    } else {
      result += '\\x' + buffer[i].toString(16).padStart(2, '0');
    }
  }

  return result;
}

test('toPrintableString', () => {
  expect(
    toPrintableString(Buffer.from('hello'))
  ).toEqual('hello');

  expect(
    toPrintableString(Buffer.from('he\x00llo'))
  ).toEqual('he\\x00llo');
});
