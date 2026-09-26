import { createHandler, StartServer } from '@solidjs/start/server';
import { gtmNoscriptIframe, trackingHeadScripts } from './lib/tracking';
export default createHandler(() => <StartServer document={props => <html lang="en" data-theme="amaleh">
  <head>
    <meta charset="utf-8"/>
    {trackingHeadScripts.map(script => <script innerHTML={script}/>)}
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="theme-color" content="#0f1216"/>
    <link rel="icon" type="image/png" sizes="32x32" href={`${import.meta.env.BASE_URL}brand/favicon-32.png`}/>
    <link rel="icon" type="image/png" sizes="16x16" href={`${import.meta.env.BASE_URL}brand/favicon-16.png`}/>
    <link rel="apple-touch-icon" type="image/png" sizes="180x180" href={`${import.meta.env.BASE_URL}brand/apple-touch-icon.png`}/>
    {props.assets}
  </head>
  <body><noscript innerHTML={gtmNoscriptIframe}/><div id="app">{props.children}</div>{props.scripts}</body>
</html>}/>);
