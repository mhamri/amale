export const consentRegions = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
  'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'GF', 'GP', 'MQ', 'RE', 'YT', 'MF',
  'IS', 'LI', 'NO',
  'GB',
  'CH',
] as const;

export const consentStorageKey = 'amaleh-consent';

export const consentSignals = ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage'] as const;

export type ConsentChoice = 'granted' | 'denied';

export function consentSignalsSetTo(choice: ConsentChoice): Record<(typeof consentSignals)[number], ConsentChoice> {
  return Object.fromEntries(consentSignals.map((signal) => [signal, choice])) as Record<(typeof consentSignals)[number], ConsentChoice>;
}

const storedChoiceUpdate = consentSignals.map((signal) => `${signal}:choice`).join(',');

export const consentDefaultsScript = [
  'window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}',
  `gtag('consent','default',${JSON.stringify({ ...consentSignalsSetTo('denied'), wait_for_update: 500, region: consentRegions })});`,
  `gtag('consent','default',${JSON.stringify(consentSignalsSetTo('granted'))});`,
  `(function(){try{var choice=localStorage.getItem(${JSON.stringify(consentStorageKey)});if(choice==='granted'||choice==='denied')gtag('consent','update',{${storedChoiceUpdate}});}catch(e){}})();`,
].join('\n');
