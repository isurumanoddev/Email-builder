import * as React from 'react';
import {
  Section,
  Row,
  Column,
  Text,
  Heading,
  Img,
  Link,
  Button,
  Hr,
  Head,
} from '@react-email/components';
import type { ReactEmailNode, FigmaReactEmailBlockProps } from '@/lib/figma/types/reactEmailAst';

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
        <Section key={key} style={{ maxWidth: 600, ...node.style }}>
          {node.children.map((child, i) => renderNode(child, `${key}-s-${i}`))}
        </Section>
      );
    case 'Row':
      return (
        <Row key={key}>
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
        <Text key={key} style={node.style}>
          {node.content}
        </Text>
      );
    case 'Heading':
      return (
        <Heading key={key} as={node.as ?? 'h2'} style={node.style}>
          {node.content}
        </Heading>
      );
    case 'Img': {
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
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            <Img
              src={node.mobileSrc}
              width={node.width}
              height={node.height}
              alt={node.alt ?? ''}
              className={`${base}-mob`}
              style={{ maxWidth: '100%', height: 'auto' }}
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
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      );
    }
    case 'Link':
      return (
        <Link key={key} href={node.href}>
          {node.children.map((child, i) => renderNode(child, `${key}-l-${i}`))}
        </Link>
      );
    case 'Button':
      return (
        <Button key={key} href={node.href} style={node.style}>
          {node.label}
        </Button>
      );
    case 'Hr':
      return <Hr key={key} style={node.style} />;
    default:
      return null;
  }
}

export const FigmaReactEmailBlock: React.FC<FigmaReactEmailBlockProps> = ({
  tree,
}) => {
  if (!tree) {
    return (
      <Section style={{ maxWidth: 600, padding: 20 }}>
        <Text style={{ color: '#666666', fontFamily: 'sans-serif' }}>
          Empty Figma import
        </Text>
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
