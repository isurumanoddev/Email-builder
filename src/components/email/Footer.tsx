import * as React from 'react';
import { Img, Link } from '@react-email/components';

// ============================================================================
// TYPES
// ============================================================================

export interface SocialLink {
  /** Platform name */
  platform: 'facebook' | 'instagram' | 'youtube' | 'twitter' | 'linkedin' | 'tiktok';
  /** URL for the social link */
  url: string;
  /** Custom icon URL (optional) */
  iconUrl?: string;
}

export interface FooterProps {
  /** Background color */
  backgroundColor?: string;
  /** Logo image source URL */
  logoSrc?: string;
  /** Logo width */
  logoWidth?: number;
  /** Logo height */
  logoHeight?: number;
  /** Logo alt text */
  logoAlt?: string;
  /** Logo link URL */
  logoUrl?: string;
  /** Social section title */
  socialTitle?: string;
  /** Array of social links */
  socialLinks?: SocialLink[];
  /** Social icon size */
  socialIconSize?: number;
  /** Show divider line */
  showDivider?: boolean;
  /** Divider color */
  dividerColor?: string;
  /** Legal text */
  legalText?: string;
  /** Show footer links */
  showLinks?: boolean;
  /** Manage preferences URL */
  preferencesUrl?: string;
  /** Unsubscribe URL */
  unsubscribeUrl?: string;
  /** Privacy policy URL */
  privacyUrl?: string;
  /** Link color */
  linkColor?: string;
  /** Company address */
  address?: string;
  /** Phone number display */
  phone?: string;
  /** Phone number for tel: link */
  phoneTel?: string;
  /** Copyright text */
  copyright?: string;
  /** Custom styles */
  styles?: {
    socialTitle?: React.CSSProperties;
    legalText?: React.CSSProperties;
    links?: React.CSSProperties;
    address?: React.CSSProperties;
    phone?: React.CSSProperties;
    copyright?: React.CSSProperties;
  };
}

// ============================================================================
// STYLES
// ============================================================================

const defaultStyles = {
  socialTitle: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: '14px',
    lineHeight: '20px',
    color: '#ffffff',
    paddingBottom: '8px',
  } as React.CSSProperties,
  legalText: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: '12px',
    lineHeight: '18px',
    color: '#cccccc',
    padding: '20px 40px 16px 40px',
  } as React.CSSProperties,
  links: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: '12px',
    lineHeight: '18px',
    padding: '0 40px 16px 40px',
  } as React.CSSProperties,
  address: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: '12px',
    lineHeight: '18px',
    color: '#ffffff',
    padding: '0 40px 4px 40px',
  } as React.CSSProperties,
  phone: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: '12px',
    lineHeight: '18px',
    padding: '0 40px 20px 40px',
  } as React.CSSProperties,
  copyright: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: '11px',
    lineHeight: '16px',
    color: '#999999',
    padding: '0 40px 30px 40px',
  } as React.CSSProperties,
};

// ============================================================================
// DEFAULT SOCIAL ICONS (base64 placeholder - replace with actual hosted icons)
// ============================================================================

const defaultSocialIcons: Record<string, string> = {
  facebook: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg',
  instagram: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg',
  youtube: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg',
  twitter: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg',
  linkedin: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg',
  tiktok: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const Footer: React.FC<FooterProps> = ({
  backgroundColor = '#000000',
  logoSrc,
  logoWidth = 80,
  logoHeight,
  logoAlt = 'Logo',
  logoUrl,
  socialTitle = 'Find us online',
  socialLinks = [],
  socialIconSize = 28,
  showDivider = false,
  dividerColor = '#333333',
  legalText,
  showLinks = false,
  preferencesUrl,
  unsubscribeUrl,
  privacyUrl,
  linkColor = '#ffffff',
  address,
  phone,
  phoneTel,
  copyright,
  styles = {},
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
      {/* Logo and Social Row */}
      <tr>
        <td align="center" valign="top" style={{ padding: '30px 40px 24px 40px' }}>
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            <tr>
              {/* Logo */}
              <td align="left" valign="middle" style={{ width: '50%' }}>
                {logoSrc && (
                  <>
                    {logoUrl ? (
                      <Link href={logoUrl} style={{ textDecoration: 'none' }} target="_blank">
                        <Img
                          src={logoSrc}
                          width={logoWidth}
                          alt={logoAlt}
                          style={{
                            display: 'block',
                            width: `${logoWidth}px`,
                            height: 'auto',
                          }}
                        />
                      </Link>
                    ) : (
                      <Img
                        src={logoSrc}
                        width={logoWidth}
                        alt={logoAlt}
                        style={{
                          display: 'block',
                          width: `${logoWidth}px`,
                          height: 'auto',
                        }}
                      />
                    )}
                  </>
                )}
              </td>

              {/* Social Icons */}
              <td align="right" valign="middle" style={{ width: '50%' }}>
                <table cellPadding={0} cellSpacing={0} role="presentation">
                  {socialTitle && (
                    <tr>
                      <td
                        align="right"
                        valign="middle"
                        style={{
                          ...defaultStyles.socialTitle,
                          ...styles.socialTitle,
                        }}
                      >
                        {socialTitle}
                      </td>
                    </tr>
                  )}
                  {socialLinks.length > 0 && (
                    <tr>
                      <td align="right" valign="middle">
                        <table cellPadding={0} cellSpacing={0} role="presentation">
                          <tr>
                            {socialLinks.map((social, index) => (
                              <td
                                key={social.platform}
                                align="center"
                                valign="middle"
                                style={{
                                  paddingRight: index < socialLinks.length - 1 ? '12px' : '0',
                                }}
                              >
                                <Link
                                  href={social.url}
                                  target="_blank"
                                  style={{ textDecoration: 'none' }}
                                >
                                  <Img
                                    src={social.iconUrl || defaultSocialIcons[social.platform]}
                                    width={socialIconSize}
                                    height={socialIconSize}
                                    alt={social.platform}
                                    style={{
                                      display: 'block',
                                      width: `${socialIconSize}px`,
                                      height: `${socialIconSize}px`,
                                    }}
                                  />
                                </Link>
                              </td>
                            ))}
                          </tr>
                        </table>
                      </td>
                    </tr>
                  )}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      {/* Divider */}
      {showDivider && (
        <tr>
          <td align="center" valign="top" style={{ padding: '0 40px' }}>
            <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
              <tr>
                <td
                  style={{
                    height: '1px',
                    fontSize: '1px',
                    lineHeight: '1px',
                    backgroundColor: dividerColor,
                  }}
                >
                  &nbsp;
                </td>
              </tr>
            </table>
          </td>
        </tr>
      )}

      {/* Legal Text */}
      {legalText && (
        <tr>
          <td
            align="left"
            valign="top"
            style={{
              ...defaultStyles.legalText,
              ...styles.legalText,
            }}
            dangerouslySetInnerHTML={{ __html: legalText }}
          />
        </tr>
      )}

      {/* Links Row */}
      {showLinks && (
        <tr>
          <td
            align="left"
            valign="top"
            style={{
              ...defaultStyles.links,
              ...styles.links,
            }}
          >
            {preferencesUrl && (
              <Link
                href={preferencesUrl}
                style={{ color: linkColor, textDecoration: 'underline' }}
                target="_blank"
              >
                Manage preferences
              </Link>
            )}
            {preferencesUrl && unsubscribeUrl && ' | '}
            {unsubscribeUrl && (
              <Link
                href={unsubscribeUrl}
                style={{ color: linkColor, textDecoration: 'underline' }}
                target="_blank"
              >
                Unsubscribe
              </Link>
            )}
            {(preferencesUrl || unsubscribeUrl) && privacyUrl && ' | '}
            {privacyUrl && (
              <Link
                href={privacyUrl}
                style={{ color: linkColor, textDecoration: 'underline' }}
                target="_blank"
              >
                Privacy Policy
              </Link>
            )}
          </td>
        </tr>
      )}

      {/* Address */}
      {address && (
        <tr>
          <td
            align="left"
            valign="top"
            style={{
              ...defaultStyles.address,
              ...styles.address,
            }}
            dangerouslySetInnerHTML={{ __html: address }}
          />
        </tr>
      )}

      {/* Phone */}
      {phone && (
        <tr>
          <td
            align="left"
            valign="top"
            style={{
              ...defaultStyles.phone,
              ...styles.phone,
            }}
          >
            <Link
              href={`tel:${phoneTel || phone.replace(/\D/g, '')}`}
              style={{ color: linkColor, textDecoration: 'underline' }}
              target="_blank"
            >
              {phone}
            </Link>
          </td>
        </tr>
      )}

      {/* Copyright */}
      {copyright && (
        <tr>
          <td
            align="left"
            valign="top"
            style={{
              ...defaultStyles.copyright,
              ...styles.copyright,
            }}
            dangerouslySetInnerHTML={{ __html: copyright }}
          />
        </tr>
      )}
    </table>
  );
};

export default Footer;

