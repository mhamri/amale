import { createHandler, StartServer } from '@solidjs/start/server';
import { consentDefaultsScript } from './lib/consent';
export default createHandler(() => <StartServer document={props => <html lang="en" data-theme="amaleh">
  <head>
    <meta charset="utf-8"/>
    <script innerHTML={consentDefaultsScript}/>
    <script innerHTML={`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-T8QCHM2H');`}/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="theme-color" content="#0f1216"/>
    <link rel="icon" type="image/svg+xml" href={`${import.meta.env.BASE_URL}mark.svg`}/>
    {props.assets}
  </head>
  <body><noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T8QCHM2H" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript><div id="app">{props.children}</div>{props.scripts}</body>
</html>}/>);
