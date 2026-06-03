import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import TwoColDualCtaEmail from '@/emails/TwoColDualCtaEmail';
import TwoColStackedEmail from '@/emails/TwoColStackedEmail';
import CompleteEmail from '@/emails/CompleteEmail';
import AllComponentsEmail from '@/emails/AllComponentsEmail';
import NissanEmail from '@/emails/NissanEmail';

const templates: Record<string, React.FC> = {
  'two-col-dual-cta': TwoColDualCtaEmail,
  'two-col-stacked': TwoColStackedEmail,
  'complete-email': CompleteEmail,
  'all-components': AllComponentsEmail,
  'nissan': NissanEmail,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ template: string }> }
) {
  const { template } = await params;
  
  const EmailComponent = templates[template];
  
  if (!EmailComponent) {
    return NextResponse.json(
      { error: 'Template not found' },
      { status: 404 }
    );
  }

  try {
    const html = await render(EmailComponent({}));
    
    return NextResponse.json({ html });
  } catch (error) {
    console.error('Error rendering email:', error);
    return NextResponse.json(
      { error: 'Failed to render email' },
      { status: 500 }
    );
  }
}
