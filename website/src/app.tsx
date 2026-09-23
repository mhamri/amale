import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { MetaProvider } from '@solidjs/meta';
import { Suspense } from 'solid-js';
import Header from './components/Header';
import Footer from './components/Footer';
import { Drifter, Glow, GridDots, LightRays, Reveal, Rings } from './components/decor';
import './style.css';

export default function App() {
  return (
    <Router
      base={import.meta.env.BASE_URL}
      root={(props) => (
        <MetaProvider>
          <a class="skip-link" href="#main">Skip to content</a>

          {/*
            The shell's ambient depth, shared by every route: the ledger is
            lit from above and the screen throws its own light back. It is a
            single clipped field pinned to the viewport, painted behind all
            content, so no page has to place it and none can be reached by it.
            The layers overlap, so each stays low: stacked at their brightest
            they still leave `dim` text on the page background above 4.5:1.
          */}
          <div class="decor-field fixed" aria-hidden="true" data-reveal>
            <GridDots hue="secondary" spacing={28} cx={0.82} cy={0} opacity={0.32} />
            <Glow hue="primary" size={880} cx={0.84} cy={-0.06} opacity={0.42} />
            {/* The gauge arc only reads as a bezel where there is room for it
                to sit clear of the copy; on a phone it would cut across the
                headline, so it is hidden below sm. */}
            <Rings hue="primary" size={560} cx={0.95} cy={-0.04} opacity={0.32} class="hidden sm:block" />
            <Drifter direction="vertical" distance={22}>
              <LightRays hue="primary" cx={0.84} cy={-0.08} spread={122} opacity={0.32} />
            </Drifter>
            <Glow hue="secondary" size={1080} cx={0.1} cy={1.06} opacity={0.34} />
          </div>

          <Header />
          <Suspense>{props.children}</Suspense>
          <Footer />
          <Reveal />
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}