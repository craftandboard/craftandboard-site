import { serializeStructuredData } from "../../lib/seo/structuredData";

export function StructuredDataScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeStructuredData(data) }}
    />
  );
}
