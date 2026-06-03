import * as React from 'react';
import { Head } from '@react-email/components';
import { EMAIL_RESPONSIVE_CSS } from '@/lib/email/responsive';

/** Inject responsive CSS — include once in each email <Html> document */
export function EmailResponsiveHead(): React.ReactElement {
  return (
    <Head>
      <style>{EMAIL_RESPONSIVE_CSS}</style>
    </Head>
  );
}

export default EmailResponsiveHead;
