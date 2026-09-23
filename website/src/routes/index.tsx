import PageMeta from '../components/PageMeta';
import Problem from '../components/landing/Problem';
import Benefits from '../components/landing/Benefits';
import Division from '../components/landing/Division';
import Install from '../components/landing/Install';
import Continue from '../components/landing/Continue';

export default function Home() {
  return (
    <>
      <PageMeta
        title="Amale — coordinated workers, verified delivery"
        description="Amale is a self-contained workflow skill for Codex and Claude. It plans, delegates implementation to cheap Flash models, reviews independently and verifies delivery, then resumes from disk."
      />
      <main id="main">
        <Problem />
        <Benefits />
        <Division />
        <Install />
        <Continue />
      </main>
    </>
  );
}
