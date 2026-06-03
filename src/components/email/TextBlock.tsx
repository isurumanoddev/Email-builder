import * as React from 'react';

export interface TextBlockProps {
  content: string;
  backgroundColor?: string;
  deskPadding?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: string;
  lineHeight?: string;
  color?: string;
}

export const TextBlock: React.FC<TextBlockProps> = ({
  content,
  backgroundColor = '#ffffff',
  deskPadding = '20px 40px',
  textAlign = 'left',
  fontSize = '16px',
  lineHeight = '26px',
  color = '#333333',
}) => {
  return (
    <table
      width={600}
      cellPadding={0}
      cellSpacing={0}
      style={{ width: '600px', backgroundColor }}
      role="presentation"
    >
      <tr>
        <td
          align={textAlign}
          valign="top"
          style={{
            padding: deskPadding,
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            fontSize,
            lineHeight,
            color,
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </tr>
    </table>
  );
};

export default TextBlock;
