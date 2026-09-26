import { consentDefaultsScript } from './consent.ts';

export const gtmLoaderScript = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-T8QCHM2H');`;

export const gtmNoscriptIframe =
  '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T8QCHM2H" height="0" width="0" style="display:none;visibility:hidden"></iframe>';

export const trackingHeadScripts = [consentDefaultsScript, gtmLoaderScript] as const;

export function withTracking(html: string): string {
  const headStart = html.match(/<head\b[^>]*>(\s*<meta\s+charset=[^>]*>)?/i);
  const bodyStart = html.match(/<body\b[^>]*>/i);
  if (!headStart || !bodyStart) throw new Error('withTracking needs a document with <head> and <body>');
  const headScripts = trackingHeadScripts.map((script) => `<script>${script}</script>`).join('');
  return html
    .replace(headStart[0], `${headStart[0]}${headScripts}`)
    .replace(bodyStart[0], `${bodyStart[0]}<noscript>${gtmNoscriptIframe}</noscript>`);
}
