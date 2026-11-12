import { useState } from 'react';
import { ArrowLink, Label } from '@/components/editorial';
import { Button } from '@/components/ui/button';
import { SubscribeForm } from '@/features/newsletter/subscribe-form';
import { useSearchParams } from '@/lib/navigation';
import { Meta } from '@/lib/meta';

type Leaving = 'ask' | 'sending' | 'done' | 'failed';

/**
 * Where the links in the emails land: "your address is confirmed", and the page that
 * asks before unsubscribing. Unsubscribing is a button, not the link itself, so a mail
 * scanner that opens every link cannot take anyone off the list.
 */
export default function SubscriptionPage() {
  const params = useSearchParams();
  const state = params.get('state');
  const leaveToken = params.get('leave');
  const [leaving, setLeaving] = useState<Leaving>('ask');

  const leave = async () => {
    setLeaving('sending');
    try {
      const response = await fetch('/api/v1/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: leaveToken }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        data?: { unsubscribed?: boolean };
      };
      setLeaving(response.ok && body.data?.unsubscribed ? 'done' : 'failed');
    } catch {
      setLeaving('failed');
    }
  };

  let heading = 'New writings, by email.';
  let body = 'Leave an address, and each new writing will reach you when it is published.';
  if (leaveToken) {
    heading =
      leaving === 'done' ? 'You have been unsubscribed.' : 'Stop the emails about new writings?';
    body =
      leaving === 'done'
        ? 'No more emails will be sent to this address. The writing stays here whenever you want it.'
        : leaving === 'failed'
          ? 'That link did not work. It may be incomplete; try the link from the latest email again.'
          : 'One click, and this address is taken off the list.';
  } else if (state === 'confirmed') {
    heading = 'Your address is confirmed.';
    body = 'When Triyan publishes a new writing, it will reach you by email.';
  } else if (state === 'invalid') {
    heading = 'That link did not work.';
    body = 'It may have been cut short, or already used. You can sign up again below.';
  }

  const showForm = !leaveToken && state !== 'confirmed';

  return (
    <main id="main" className="gutter">
      <Meta title="Subscription" noindex />
      <div className="mx-auto max-w-[90rem] pt-24 pb-32 sm:pt-32">
        <Label as="p">Subscription</Label>
        <h1
          role="status"
          className="mt-8 max-w-4xl font-display text-[clamp(2.75rem,7vw,6rem)] leading-[0.95] font-light tracking-tight"
        >
          {heading}
        </h1>
        <p className="mt-8 max-w-xl font-reading text-xl leading-prose text-fg-muted">{body}</p>

        {leaveToken && leaving !== 'done' && (
          <div className="mt-12">
            <Button variant="solid" disabled={leaving === 'sending'} onClick={() => void leave()}>
              {leaving === 'sending' ? 'Unsubscribing…' : 'Unsubscribe'}
            </Button>
          </div>
        )}

        {showForm && <SubscribeForm className="relative mt-14 max-w-xl" />}

        <div className="mt-16">
          <ArrowLink href="/writings">Read the writings</ArrowLink>
        </div>
      </div>
    </main>
  );
}
