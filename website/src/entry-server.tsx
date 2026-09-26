import { createHandler, StartServer } from '@solidjs/start/server';
import { gtmNoscriptIframe, trackingHeadScripts } from './lib/tracking';
import { APPLE_TOUCH_ICON, FAVICONS, type BrandImage } from './lib/brand';
const iconSizes = (image: BrandImage) => `${image.size}x${image.size}`;
export default createHandler(() => <StartServer document={props => <html lang="en" data-theme="amaleh">
  <head>
    <meta charset="utf-8"/>
    {trackingHeadScripts.map(script => <script innerHTML={script}/>)}
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="theme-color" content="#0f1216"/>
    {FAVICONS.map(icon => <link rel="icon" type="image/png" sizes={iconSizes(icon)} href={`${import.meta.env.BASE_URL}${icon.publicPath}`}/>)}
    <link rel="apple-touch-icon" type="image/png" sizes={iconSizes(APPLE_TOUCH_ICON)} href={`${import.meta.env.BASE_URL}${APPLE_TOUCH_ICON.publicPath}`}/>
    {props.assets}
  </head>
  <body><noscript innerHTML={gtmNoscriptIframe}/><div id="app">{props.children}</div>{props.scripts}</body>
</html>}/>);
