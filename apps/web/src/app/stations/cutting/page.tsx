import { StationQueue } from "../../../components/station-queue";
import { getStationQueue } from "../../../lib/api";

export default async function CuttingStationPage() {
  const queue = await getStationQueue("cutting");
  const parts = queue && "parts" in queue ? queue.parts : [];

  return (
    <section className="space-y-6">
      <StationQueue station="cutting" nextStatus="CUT" initialParts={parts} />
    </section>
  );
}
