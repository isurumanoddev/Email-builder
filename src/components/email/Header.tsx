import * as React from 'react';
import { Img, Link } from '@react-email/components';

export interface HeaderProps {
  logoSrc: string;
  logoWidth?: number;
  logoHeight?: number;
  logoAlt?: string;
  logoUrl?: string;
  backgroundColor?: string;
  deskPadding?: string;
  align?: 'left' | 'center' | 'right';
}

export const Header: React.FC<HeaderProps> = ({
  logoSrc,
  logoWidth = 200,
  logoHeight,
  logoAlt = 'Logo',
  logoUrl,
  backgroundColor = '#ffffff',
  deskPadding = '25px 40px',
  align = 'center',
}) => {
  const img = (
    <Img
      src={logoSrc}
      width={logoWidth}
      height={logoHeight}
      alt={logoAlt}
      style={{
        display: 'block',
        width: `${logoWidth}px`,
        height: logoHeight ? `${logoHeight}px` : 'auto',
      }}
    />
  );

  return (
    <table
      width={600}
      cellPadding={0}
      cellSpacing={0}
      style={{ width: '600px', backgroundColor }}
      role="presentation"
    >
      <tr>
        <td align={align} valign="middle" style={{ padding: deskPadding }}>
          {logoUrl ? (
            <Link href={logoUrl} target="_blank">
              {img}
            </Link>
          ) : (
            img
          )}
        </td>
      </tr>
    </table>
  );
};

export default Header;
