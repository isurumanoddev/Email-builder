import * as React from 'react';

export interface DividerProps {
  backgroundColor?: string;
  lineColor?: string;
  lineHeight?: number;
  deskPadding?: string;
  width?: number;
}

export const Divider: React.FC<DividerProps> = ({
  backgroundColor = '#ffffff',
  lineColor = '#e5e5e5',
  lineHeight = 1,
  deskPadding = '20px 40px',
  width = 520,
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
        <td align="center" valign="top" style={{ padding: deskPadding }}>
          <table
            width={width}
            cellPadding={0}
            cellSpacing={0}
            style={{ width: `${width}px` }}
            role="presentation"
          >
            <tr>
              <td
                style={{
                  borderTop: `${lineHeight}px solid ${lineColor}`,
                  fontSize: '0',
                  lineHeight: '0',
                }}
              >
                &nbsp;
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  );
};

export default Divider;
