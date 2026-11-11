import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ShareActions } from './share-actions';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const URL_ = 'https://triyan.test/writings/a-poem';

describe('ShareActions', () => {
  it('links to WhatsApp and X with the writing URL', () => {
    render(<ShareActions title="A poem" url={URL_} />);
    const whatsapp = screen.getByRole('link', { name: /whatsapp/i }).getAttribute('href') ?? '';
    const x = screen.getByRole('link', { name: /^x/i }).getAttribute('href') ?? '';
    expect(whatsapp).toContain(encodeURIComponent(URL_));
    expect(x).toContain(encodeURIComponent(URL_));
  });

  it('copies the link and confirms it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    render(<ShareActions title="A poem" url={URL_} />);
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/copied/i));
    expect(writeText).toHaveBeenCalledWith(URL_);
  });

  it('is honest that Instagram has no web share: it copies the link instead', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText }, share: undefined });
    render(<ShareActions title="A poem" url={URL_} />);
    fireEvent.click(screen.getByRole('button', { name: /instagram/i }));
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toMatch(/paste it into instagram/i),
    );
  });
});
