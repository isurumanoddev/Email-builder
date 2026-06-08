import * as React from 'react';
import {
  Section,
  Container,
  Row,
  Column,
  Text,
  Heading,
  Img,
  Link,
  Button,
  Hr,
  Head,
} from '@/lib/email/react-email';
import type { ReactEmailNode, FigmaReactEmailBlockProps } from '@/lib/figma/types/reactEmailAst';

const EMAIL_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

function collectResponsiveImgClasses(node: ReactEmailNode, classes = new Set<string>()): Set<string> {
  if (node.type === 'Img' && node.mobileSrc && node.className) {
    classes.add(node.className);
  }
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      collectResponsiveImgClasses(child, classes);
    }
  }
  return classes;
}

function ResponsiveStyles({ tree }: { tree: ReactEmailNode }) {
  const classes = collectResponsiveImgClasses(tree);
  if (classes.size === 0) return null;

  const rules = [...classes]
    .map(
      (cls) => `
    .${cls}-desk { display: block !important; }
    .${cls}-mob { display: none !important; max-height: 0; overflow: hidden; }
    @media only screen and (max-width: 600px) {
      .${cls}-desk { display: none !important; max-height: 0; overflow: hidden; }
      .${cls}-mob { display: block !important; max-height: none !important; }
    }`
    )
    .join('\n');

  return (
    <Head>
      <style>{rules}</style>
    </Head>
  );
}

function renderNode(node: ReactEmailNode, key: string): React.ReactNode {
  switch (node.type) {
    case 'Section':
      return (
        <Section key={key} style={{ width: '100%', ...node.style }}>
          {node.children.map((child, i) => renderNode(child, `${key}-s-${i}`))}
        </Section>
      );

    case 'Container':
      return (
        <Container
          key={key}
          style={{
            maxWidth: 600,
            width: '100%',
            margin: '0 auto',
            ...node.style,
          }}
        >
          {node.children.map((child, i) => renderNode(child, `${key}-ct-${i}`))}
        </Container>
      );

    case 'Row':
      return (
        <Row key={key} style={{ width: '100%', ...node.style }}>
          {node.children.map((child, i) => renderNode(child, `${key}-r-${i}`))}
        </Row>
      );

    case 'Column':
      return (
        <Column key={key} style={node.style}>
          {node.children.map((child, i) => renderNode(child, `${key}-c-${i}`))}
        </Column>
      );

    case 'Text':
      return (
        <Text
          key={key}
          style={{
            margin: 0,
            padding: 0,
            whiteSpace: 'pre-line',
            fontFamily: EMAIL_FONT,
            ...node.style,
          }}
        >
          {node.content}
        </Text>
      );

    case 'Heading':
      return (
        <Heading
          key={key}
          as={node.as ?? 'h2'}
          style={{
            margin: 0,
            padding: 0,
            whiteSpace: 'pre-line',
            fontFamily: EMAIL_FONT,
            ...node.style,
          }}
        >
          {node.content}
        </Heading>
      );

    case 'Img': {
      const imgStyle: React.CSSProperties = {
        display: 'block',
        maxWidth: '100%',
        height: 'auto',
      };

      if (node.mobileSrc) {
        const base = node.className ?? `figma-img-${key}`;
        return (
          <React.Fragment key={key}>
            <Img
              src={node.src}
              width={node.width}
              height={node.height}
              alt={node.alt ?? ''}
              className={`${base}-desk`}
              style={imgStyle}
            />
            <Img
              src={node.mobileSrc}
              width={node.width}
              height={node.height}
              alt={node.alt ?? ''}
              className={`${base}-mob`}
              style={imgStyle}
            />
          </React.Fragment>
        );
      }

      return (
        <Img
          key={key}
          src={node.src}
          width={node.width}
          height={node.height}
          alt={node.alt ?? ''}
          style={{ ...imgStyle, margin: '0 0 16px 0' }}
        />
      );
    }

    case 'Link':
      return (
        <Link key={key} href={node.href} style={{ color: 'inherit', textDecoration: 'underline' }}>
          {node.children.map((child, i) => renderNode(child, `${key}-l-${i}`))}
        </Link>
      );

    case 'Button': {
      const { textAlign, marginTop, ...containerRest } = node.containerStyle ?? {};

      return (
        <Section
          key={key}
          style={{
            width: '100%',
            textAlign: textAlign ?? 'center',
            marginTop,
            ...containerRest,
          }}
        >
            <Button
              href={node.href}
              style={{
                margin: 0,
                display: 'inline-block',
                textDecoration: 'none',
                textAlign: 'center' as const,
                boxSizing: 'border-box',
                maxWidth: '100%',
                fontFamily: EMAIL_FONT,
                ...node.style,
              }}
            >
              {node.label}
            </Button>
        </Section>
      );
    }

    case 'Hr':
      return (
        <Hr
          key={key}
          style={{
            borderColor: '#e6ebf1',
            borderWidth: '1px',
            borderStyle: 'solid',
            width: '100%',
            margin: '20px 0',
            ...node.style,
          }}
        />
      );

    case 'Spacer':
      return (
        <Section key={key} style={{ height: node.height, lineHeight: '1px', fontSize: '1px' }}>
          <Text style={{ margin: 0, fontSize: '1px', lineHeight: `${node.height}px` }}>
            &nbsp;
          </Text>
        </Section>
      );

    default:
      return null;
  }
}

export const FigmaReactEmailBlock: React.FC<FigmaReactEmailBlockProps> = ({ tree }) => {
  if (!tree) {
    return (
      <Section style={{ maxWidth: 600, padding: 20 }}>
        <Text style={{ color: '#666666', fontFamily: EMAIL_FONT }}>Empty Figma import</Text>
      </Section>
    );
  }

  return (
    <>
      <ResponsiveStyles tree={tree} />
      {renderNode(tree, 'root')}
    </>
  );
};

export default FigmaReactEmailBlock;
