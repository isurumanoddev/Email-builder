import * as React from 'react';

export interface SpacerProps {
  height?: number;
  backgroundColor?: string;
}

export const Spacer: React.FC<SpacerProps> = ({
  height = 32,
  backgroundColor = '#ffffff',
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
          style={{
            height: `${height}px`,
            lineHeight: `${height}px`,
            fontSize: '0',
          }}
        >
          &nbsp;
        </td>
      </tr>
    </table>
  );
};

export default Spacer;
