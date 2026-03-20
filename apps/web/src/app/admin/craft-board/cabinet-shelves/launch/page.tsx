import { CabinetShelfLaunch } from "../../../../../components/cabinet-shelf-launch";
import { buildCabinetShelfLaunchPacket } from "../../../../../lib/seo/cabinetShelfLaunch";

export const dynamic = "force-dynamic";

export default async function CabinetShelfLaunchPage() {
  const packet = await buildCabinetShelfLaunchPacket();

  return <CabinetShelfLaunch packet={packet} />;
}
