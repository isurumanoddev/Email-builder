import * as React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface IntroCopyProps {
  /** Greeting text (e.g., "Hello John,") */
  greeting?: string;
  /** Main body text content */
  body?: string;
  /** Background color */
  backgroundColor?: string;
  /** Padding for desktop */
  deskPadding?: string;
  /** Text alignment */
  textAlign?: 'left' | 'center' | 'right';
  /** Custom styles for greeting */
  greetingStyle?: React.CSSProperties;
  /** Custom styles for body text */
  bodyStyle?: React.CSSProperties;
  /** Custom styles for the container */
  textStyle?: React.CSSProperties;
}

// ============================================================================
// STYLES
// ============================================================================

const defaultStyles = {
  container: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: '16px',
    lineHeight: '24px',
    color: '#333333',
  } as React.CSSProperties,
  greeting: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    lineHeight: '24px',
    color: '#333333',
  } as React.CSSProperties,
  body: {
    margin: 0,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#333333',
  } as React.CSSProperties,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const IntroCopy: React.FC<IntroCopyProps> = ({
  greeting,
  body,
  backgroundColor = '#ffffff',
  deskPadding = '20px 40px 20px 40px',
  textAlign = 'left',
  greetingStyle,
  bodyStyle,
  textStyle,
}) => {
  return (
    <table
      width={600}
      cellPadding={0}
      cellSpacing={0}
      style={{
        width: '600px',
        backgroundColor: backgroundColor,
      }}
      role="presentation"
    >
      <tr>
        <td
          align={textAlign}
          valign="top"
          style={{
            padding: deskPadding,
            ...defaultStyles.container,
            ...textStyle,
          }}
        >
          {greeting && (
            <p
              style={{
                ...defaultStyles.greeting,
                ...greetingStyle,
              }}
              dangerouslySetInnerHTML={{ __html: greeting }}
            />
          )}
          {body && (
            <p
              style={{
                ...defaultStyles.body,
                ...bodyStyle,
              }}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          )}
        </td>
      </tr>
    </table>
  );
};

export default IntroCopy;

