import type { CSSProperties } from 'react';

export type ReactEmailNode =
  | { type: 'Section'; style?: CSSProperties; children: ReactEmailNode[] }
  | { type: 'Row'; style?: CSSProperties; children: ReactEmailNode[] }
  | { type: 'Column'; style?: CSSProperties; children: ReactEmailNode[] }
  | { type: 'Text'; content: string; style?: CSSProperties }
  | { type: 'Heading'; content: string; as?: 'h1' | 'h2' | 'h3'; style?: CSSProperties }
  | {
      type: 'Img';
      src: string;
      mobileSrc?: string;
      width?: number;
      height?: number;
      alt?: string;
      className?: string;
    }
  | { type: 'Link'; href: string; children: ReactEmailNode[] }
  | {
      type: 'Button';
      href: string;
      label: string;
      style?: CSSProperties;
      containerStyle?: CSSProperties;
    }
  | { type: 'Hr'; style?: CSSProperties };

export interface FigmaReactEmailBlockProps {
  tree: ReactEmailNode;
  sourceFrame?: string;
  mobileFrame?: string;
}
