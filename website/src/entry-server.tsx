import { createHandler, StartServer } from '@solidjs/start/server';
export default createHandler(() => <StartServer document={props => <html lang="en" data-theme="amale">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="theme-color" content="#0f1216"/>
    <link rel="icon" type="image/svg+xml" href={`${import.meta.env.BASE_URL}mark.svg`}/>
    {props.assets}
  </head>
  <body><div id="app">{props.children}</div>{props.scripts}</body>
</html>}/>);
