import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Button, ButtonLink } from './button.js';
import { Chip } from './chip.js';
import { TextField, TextAreaField } from './field.js';
import { Prose } from './prose.js';
import { Rule } from './rule.js';
import { Reveal } from './reveal.js';

afterEach(cleanup);

describe('Button', () => {
  it('renders a real button element', () => {
    render(<Button>Read</Button>);
    expect(screen.getByRole('button', { name: 'Read' })).toBeTruthy();
  });

  it('renders a navigation target as an anchor, not a button', () => {
    render(<ButtonLink href="/writings">Archive</ButtonLink>);
    const link = screen.getByRole('link', { name: 'Archive' });
    expect(link.getAttribute('href')).toBe('/writings');
  });

  it('is not focusable or clickable when disabled', () => {
    render(<Button disabled>Publish</Button>);
    const button = screen.getByRole('button', { name: 'Publish' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('Chip', () => {
  it('announces its toggle state rather than only colouring it', () => {
    render(<Chip active>Grief &amp; Melancholy</Chip>);
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
  });

  it('defaults to unpressed', () => {
    render(<Chip>Existentialism</Chip>);
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('false');
  });

  it('shows a count when given one', () => {
    render(<Chip count={12}>Love &amp; Longing</Chip>);
    expect(screen.getByText('12')).toBeTruthy();
  });
});

describe('TextField', () => {
  it('associates its label with the control', () => {
    render(<TextField label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input.tagName).toBe('INPUT');
  });

  it('marks invalid and announces the error', () => {
    render(<TextField label="Email" error="That does not look like an email address" />);
    const input = screen.getByLabelText('Email');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('does not look like');
    expect(input.getAttribute('aria-describedby')).toContain(alert.id);
  });

  it('describes the control with a hint without marking it invalid', () => {
    render(<TextField label="Name" hint="Optional" />);
    const input = screen.getByLabelText('Name');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('supports a textarea variant', () => {
    render(<TextAreaField label="Message" />);
    expect(screen.getByLabelText('Message').tagName).toBe('TEXTAREA');
  });
});

describe('Prose', () => {
  it('sets Hindi in the Devanagari face and marks the language', () => {
    const { container } = render(
      <Prose language="HINDI" variant="poem">
        तन्हाई
      </Prose>,
    );
    const node = container.firstElementChild;
    expect(node?.getAttribute('lang')).toBe('hi');
    expect(node?.className).toContain('font-reading-deva');
  });

  it('uses the Latin reading face for English', () => {
    const { container } = render(<Prose language="ENGLISH">Some people leave</Prose>);
    const node = container.firstElementChild;
    expect(node?.getAttribute('lang')).toBe('en');
    expect(node?.className).toContain('font-reading');
    expect(node?.className).not.toContain('font-reading-deva');
  });

  it('gives poetry a narrower measure and preserves its line breaks', () => {
    const { container } = render(<Prose variant="poem">a{'\n'}b</Prose>);
    const className = container.firstElementChild?.className ?? '';
    expect(className).toContain('measure-poem');
    expect(className).toContain('whitespace-pre-line');
  });
});

describe('Rule', () => {
  it('is hidden from assistive technology when purely decorative', () => {
    const { container } = render(<Rule />);
    expect(container.querySelector('hr')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('exposes its label as text while keeping the line decorative', () => {
    render(<Rule label="Archive" />);
    expect(screen.getByText('Archive')).toBeTruthy();
  });
});

describe('Reveal', () => {
  it('renders its children visibly, with no scripted hidden state', () => {
    const { container } = render(<Reveal>Writing</Reveal>);
    expect(screen.getByText('Writing')).toBeTruthy();
    // The entrance is a CSS scroll-driven animation; nothing may hide the content.
    const className = container.firstElementChild?.className ?? '';
    expect(className).toContain('reveal');
    expect(className).not.toContain('opacity-0');
  });

  it('expresses stagger as a custom property, not a timer', () => {
    const { container } = render(<Reveal stagger={3}>Writing</Reveal>);
    const node = container.firstElementChild as HTMLElement;
    expect(node.style.getPropertyValue('--reveal-step')).toBe('3');
  });

  it('renders as the requested element', () => {
    const { container } = render(<Reveal as="section">Writing</Reveal>);
    expect(container.firstElementChild?.tagName).toBe('SECTION');
  });
});
