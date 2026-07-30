import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Calendar } from '../app/components/ui/calendar.js';

describe('dependency upgrade compatibility', () => {
  it('renders the migrated React DayPicker calendar', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const html = renderToStaticMarkup(
        createElement(Calendar, {
          defaultMonth: new Date(2026, 0, 1),
        }),
      );

      expect(html).toContain('January 2026');
      expect(html).toContain('role="grid"');
      expect(html).toContain('aria-label="Go to the Previous Month"');
      expect(html).toContain('aria-label="Go to the Next Month"');
    } finally {
      consoleError.mockRestore();
    }
  });
});
