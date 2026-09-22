import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { MetaProvider } from '@solidjs/meta';
import { Suspense } from 'solid-js';
import Header from './components/Header';
import Footer from './components/Footer';
import './style.css';

export default function App() {
  return <Router base={import.meta.env.BASE_URL} root={props => <MetaProvider>
    <a class="skip-link" href="#main">Skip to content</a>
    <Header/>
    <Suspense>{props.children}</Suspense>
    <Footer/>
  </MetaProvider>}><FileRoutes/></Router>;
}
