import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ContactForm } from './contact-form';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/**
 * Required fields render a visual asterisk inside the label, so the label text is
 * "Name *". A prefix match keeps the test honest without weakening the markup.
 */
const field = (label: string) => screen.getByLabelText(new RegExp(`^${label}`));

const fill = (values: { name?: string; email?: string; message?: string }) => {
  if (values.name !== undefined)
    fireEvent.change(field('Name'), { target: { value: values.name } });
  if (values.email !== undefined)
    fireEvent.change(field('Email'), { target: { value: values.email } });
  if (values.message !== undefined)
    fireEvent.change(field('Message'), { target: { value: values.message } });
};

const submit = () =>
  fireEvent.submit(screen.getByRole('button', { name: /send/i }).closest('form')!);

describe('ContactForm', () => {
  it('validates before sending anything', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    render(<ContactForm />);
    fill({ name: '', email: 'nope', message: 'hi' });
    submit();

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends a valid message and shows a success state', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ data: { received: true } }), { status: 200 }),
        ),
    );

    render(<ContactForm />);
    fill({
      name: 'A reader',
      email: 'reader@example.test',
      message: 'Something here landed and I wanted to say so.',
    });
    submit();

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeTruthy();
    });
    expect(screen.getByText(/was sent/i)).toBeTruthy();
  });

  it('never claims success when the API cannot deliver the message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { received: true, delivery: 'PENDING_TRANSPORT' } }), {
          status: 200,
        }),
      ),
    );

    render(<ContactForm />);
    fill({
      name: 'A reader',
      email: 'reader@example.test',
      message: 'Something here landed and I wanted to say so.',
    });
    submit();

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toMatch(/not connected/i);
    });
    expect(screen.queryByText(/was sent/i)).toBeNull();
  });

  it('is closed, and sends nothing, while delivery is unavailable', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    render(<ContactForm deliverable={false} />);
    expect(screen.getByRole('note').textContent).toMatch(/not connected/i);
    expect((screen.getByRole('button', { name: /send/i }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    submit();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('reports a failure without exposing internals', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: 'RATE_LIMITED', message: 'Too many messages. Try again later.' },
          }),
          {
            status: 429,
          },
        ),
      ),
    );

    render(<ContactForm />);
    fill({
      name: 'A reader',
      email: 'reader@example.test',
      message: 'Something here landed and I wanted to say so.',
    });
    submit();

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Too many messages');
    });
    expect(screen.queryByText(/stack/i)).toBeNull();
  });

  it('survives a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    render(<ContactForm />);
    fill({
      name: 'A reader',
      email: 'reader@example.test',
      message: 'Something here landed and I wanted to say so.',
    });
    submit();

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('could not be sent');
    });
  });

  it('carries a honeypot that is hidden from assistive technology', () => {
    const { container } = render(<ContactForm />);
    const honeypot = container.querySelector('input[name="website"]');
    expect(honeypot).toBeTruthy();
    expect(honeypot?.closest('[aria-hidden="true"]')).toBeTruthy();
    expect(honeypot?.getAttribute('tabindex')).toBe('-1');
  });
});
