import type { Graph } from 'schema-dts';

type StructuredDataProps = { graph: Graph };

// Every '<' inside a JSON-LD script is an injection risk; \u003c keeps the JSON identical.
function serializeJsonLd(graph: Graph): string {
  return JSON.stringify(graph).replaceAll('<', '\\u003c');
}

export default function StructuredData(props: StructuredDataProps) {
  return <script type="application/ld+json" innerHTML={serializeJsonLd(props.graph)} />;
}
