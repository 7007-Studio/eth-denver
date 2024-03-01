import { useMemo } from "react";

import { AIGC_FACTORY_CONTRACT_ADDRESS } from "@/constants";
import {
  useReadAigcFactoryDeployedAigCs,
  useReadAigcTokenId,
} from "@/generated";
import AigcNftCreated from "@/components/model/aigcNftCreated";

import { AIGCContent } from ".";
import PromptForm from "./promptForm";

interface PromptStepProps {
  modelIndex: number;
  onArtGenerated: (metadata: AIGCContent) => void;
}

const PromptStep = ({ modelIndex, onArtGenerated }: PromptStepProps) => {
  const { data: aigcAddress } = useReadAigcFactoryDeployedAigCs({
    address: AIGC_FACTORY_CONTRACT_ADDRESS,
    args: modelIndex ? [BigInt(modelIndex)] : undefined,
  });

  const { data: lastTokenId } = useReadAigcTokenId({
    address: aigcAddress,
  });

  const tokenIds = useMemo(() => {
    const ids: number[] = [];
    if (!lastTokenId) return ids;

    for (let i = 0; i < Number(lastTokenId); i++) {
      ids.push(i);
    }
    return ids;
  }, [lastTokenId]);

  return (
    <>
      <h2 className="heading-lg 2xl:mt-24 mb-12 text-center">
        Generate your AIGC music and art with 7007 Studio
      </h2>
      <div className="py-20 px-40 max-w-[1106px] mx-auto bg-white">
        <PromptForm
          submitText="Prompt for free"
          onArtGenerated={onArtGenerated}
        />
      </div>

      <div className="mt-20 py-20 pt-10 max-w-[1106px] mx-auto">
        <h2 className="heading-lg mb-12">By our community</h2>

        {aigcAddress && (
          <AigcNftCreated tokenIds={tokenIds} aigcAddress={aigcAddress} />
        )}
      </div>
    </>
  );
};

export default PromptStep;
