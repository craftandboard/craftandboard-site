import { StationQueue } from "../../../components/station-queue";
import { getStationQueue } from "../../../lib/api";

export default async function PackingStationPage() {
  const queue = await getStationQueue("packing");
  const parts = queue && "parts" in queue ? queue.parts : [];

  return (
    <section className="space-y-6">
      <StationQueue station="packing" nextStatus="PACKED" initialParts={parts} />
    </section>
  );
}
