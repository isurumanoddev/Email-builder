import * as React from 'react';
import { Html, Body, Container, Preview } from '@react-email/components';
import { EmailResponsiveHead } from '@/components/email/EmailResponsiveHead';
import { EDM_CLASS } from '@/lib/email/responsive';
import type { EmailTemplateMeta, TemplateBlock } from '@/lib/schema/template';
import { DEFAULT_TEMPLATE_META } from '@/lib/schema/template';
import { getComponentDefinition } from '@/lib/registry';

export interface DynamicEmailTemplateProps {
  meta?: Partial<EmailTemplateMeta>;
  blocks: TemplateBlock[];
}

export function DynamicEmailTemplate({
  meta,
  blocks,
}: DynamicEmailTemplateProps): React.ReactElement {
  const resolvedMeta: EmailTemplateMeta = {
    ...DEFAULT_TEMPLATE_META,
    ...meta,
  };

  return (
    <Html>
      <EmailResponsiveHead />
      <Preview>{resolvedMeta.previewText}</Preview>
      <Body
        style={{
          backgroundColor: resolvedMeta.backgroundColor,
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: `${resolvedMeta.containerWidth}px`,
            margin: '0 auto',
          }}
        >
          {blocks.map((block) => {
            const definition = getComponentDefinition(block.componentId);

            if (!definition) {
              return (
                <table
                  key={block.id}
                  width={600}
                  cellPadding={0}
                  cellSpacing={0}
                  className={EDM_CLASS.wrapper}
                  style={{ width: '600px', backgroundColor: '#fee2e2' }}
                  role="presentation"
                >
                  <tr>
                    <td style={{ padding: '20px', color: '#991b1b', fontFamily: 'sans-serif' }}>
                      Unknown component: {block.componentId}
                    </td>
                  </tr>
                </table>
              );
            }

            const Component = definition.component;
            return <Component key={block.id} {...(block.props as object)} />;
          })}
        </Container>
      </Body>
    </Html>
  );
}

export default DynamicEmailTemplate;
