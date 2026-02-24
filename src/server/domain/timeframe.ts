import { TimeframeOption } from '@prisma/client';

export type TimeframeInput = '24h' | '3d' | '7d' | '30d';

export function timeframeInputToEnum(input: TimeframeInput): TimeframeOption {
  switch (input) {
    case '24h':
      return 'H24';
    case '3d':
      return 'D3';
    case '7d':
      return 'D7';
    case '30d':
      return 'D30';
  }
}

export function timeframeEnumToInput(timeframe: TimeframeOption): TimeframeInput {
  switch (timeframe) {
    case 'H24':
      return '24h';
    case 'D3':
      return '3d';
    case 'D7':
      return '7d';
    case 'D30':
      return '30d';
  }
}

export function timeframeToMs(timeframe: TimeframeOption): number {
  switch (timeframe) {
    case 'H24':
      return 24 * 60 * 60 * 1000;
    case 'D3':
      return 3 * 24 * 60 * 60 * 1000;
    case 'D7':
      return 7 * 24 * 60 * 60 * 1000;
    case 'D30':
      return 30 * 24 * 60 * 60 * 1000;
  }
}
