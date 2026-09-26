import PageMeta from '../components/PageMeta';
import Problem from '../components/landing/Problem';
import Benefits from '../components/landing/Benefits';
import Division from '../components/landing/Division';
import Install from '../components/landing/Install';
import Author from '../components/landing/Author';
import Continue from '../components/landing/Continue';
import FinalCall from '../components/landing/FinalCall';
import { HOME_PATH, homeGraph } from '../lib/seo';

const title = 'Amaleh — coordinated workers, verified delivery';
const description =
  'Amaleh is a self-contained workflow skill for Codex and Claude. It plans, delegates implementation to cheap Flash models, reviews independently and verifies delivery, then resumes from disk.';
const graph = homeGraph(description);

export default function Home() {
  return (
    <>
      <PageMeta path={HOME_PATH} title={title} description={description} structuredData={graph} />
      <main id="main">
        <Problem />
        <Benefits />
        <Division />
        <Install />
        <Author />
        <Continue />
        <FinalCall />
      </main>
    </>
  );
}
