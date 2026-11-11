import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Waitlist } from './waitlist';
import { ShirtSilhouette } from './silhouette';

afterEach(cleanup);

describe('Waitlist', () => {
  it('is visibly closed, and saves nothing, until a backend exists', () => {
    render(<Waitlist />);
    expect((screen.getByPlaceholderText('your email') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /join/i }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(screen.getByText(/not open yet/i)).toBeTruthy();
  });

  it('validates and joins when it is open', async () => {
    const onJoin = vi.fn().mockResolvedValue(undefined);
    render(<Waitlist onJoin={onJoin} />);
    const input = screen.getByPlaceholderText('your email');
    fireEvent.change(input, { target: { value: 'nope' } });
    fireEvent.submit(input.closest('form')!);
    expect(screen.getByRole('alert').textContent).toMatch(/complete/i);
    expect(onJoin).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'reader@example.test' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/on the list/i));
    expect(onJoin).toHaveBeenCalledWith('reader@example.test');
  });

  it('reports a failure instead of pretending to succeed', async () => {
    render(<Waitlist onJoin={vi.fn().mockRejectedValue(new Error('down'))} />);
    const input = screen.getByPlaceholderText('your email');
    fireEvent.change(input, { target: { value: 'reader@example.test' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/could not/i));
    expect(screen.queryByText(/on the list/i)).toBeNull();
  });
});

describe('ShirtSilhouette', () => {
  it('is described as a drawing of a shape, not a product', () => {
    render(<ShirtSilhouette />);
    expect(screen.getByRole('img', { name: /line drawing/i })).toBeTruthy();
  });
});
