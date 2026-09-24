import PageMeta from '../components/PageMeta';
import Problem from '../components/landing/Problem';
import Benefits from '../components/landing/Benefits';
import Division from '../components/landing/Division';
import Install from '../components/landing/Install';
import Author from '../components/landing/Author';
import Continue from '../components/landing/Continue';
import FinalCall from '../components/landing/FinalCall';

export default function Home() {
  return (
    <>
      <PageMeta
        title="Amaleh — coordinated workers, verified delivery"
        description="Amaleh is a self-contained workflow skill for Codex and Claude. It plans, delegates implementation to cheap Flash models, reviews independently and verifies delivery, then resumes from disk."
      />
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
