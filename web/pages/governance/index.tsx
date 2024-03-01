import { useMemo } from "react";

import AIGTEntry from "@/components/aigtEntry";
import { AIGC_FACTORY_CONTRACT_ADDRESS } from "@/constants";
import { useReadAigcFactoryModelIndexCurrent } from "@/generated";

export default function MarketPlace() {
  const { data: modelIndex } = useReadAigcFactoryModelIndexCurrent({
    address: AIGC_FACTORY_CONTRACT_ADDRESS,
  });

  const modelIndexList = useMemo(() => {
    const ids: number[] = [];
    if (!modelIndex) return ids;

    for (let i = 1; i <= Number(modelIndex); i++) {
      ids.push(i);
    }
    return ids;
  }, [modelIndex]);

  return (
    <div className="container mx-auto mt-12 flex min-h-screen flex-col p-4 lg:p-20 py-16">
      <h1 className="text-3xl mb-10 font-bold text-white">
        7007Lab Governance
      </h1>
      <div className="flex md:justify-center py-8 overflow-x-auto bg-[#191717]">
        <table className="table max-w-2xl">
          <thead>
            <tr>
              <th>Model name</th>
              <th>Proposals</th>
              <th>Holders</th>
              <th>Voters</th>
            </tr>
          </thead>
          <tbody>
            {modelIndexList.map((i) => (
              <AIGTEntry key={i} modelIndex={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
