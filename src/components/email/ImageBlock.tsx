import * as React from 'react';
import { Img, Link } from '@react-email/components';

export interface ImageBlockProps {
  imgSrc: string;
  imgWidth?: number;
  imgHeight?: number;
  altText?: string;
  url?: string;
  backgroundColor?: string;
  deskPadding?: string;
  align?: 'left' | 'center' | 'right';
  imgBorderRadius?: string;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({
  imgSrc,
  imgWidth = 520,
  imgHeight,
  altText = 'Image',
  url,
  backgroundColor = '#ffffff',
  deskPadding = '20px 40px',
  align = 'center',
  imgBorderRadius = '0px',
}) => {
  const image = (
    <Img
      src={imgSrc}
      width={imgWidth}
      height={imgHeight}
      alt={altText}
      style={{
        display: 'block',
        width: `${imgWidth}px`,
        height: imgHeight ? `${imgHeight}px` : 'auto',
        borderRadius: imgBorderRadius,
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
        <td align={align} valign="top" style={{ padding: deskPadding }}>
          {url ? (
            <Link href={url} target="_blank">
              {image}
            </Link>
          ) : (
            image
          )}
        </td>
      </tr>
    </table>
  );
};

export default ImageBlock;
