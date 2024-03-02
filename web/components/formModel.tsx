"use client";

import React, { useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

import {
  useWatchAigcFactoryAigcCreatedEvent,
  useWriteAigcFactoryCreateAigc,
  useReadAigcFactoryModelIndexCurrent,
} from "@/generated";
import TextInput from "./textInput";
import { getContractAddress } from "@/helpers";

export interface IFormModelInput {
  name: string;
  description: string;
  tokenSymbol: string;
  tokenTotalSupply: number;
  tokenInitialPrice: string;
  tokenRoyaltyShare: number;
  tokenOwnerReservePercentage: number;
  file: File[];
}

interface FormModelProps {
  setIsGenerating: (isGenerating: boolean) => void;
}

export default function FormModel({ setIsGenerating }: FormModelProps) {
  const router = useRouter();
  const { isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const aigcFactory = getContractAddress("AIGCFactory", chainId);
  const { data: modelIndex } = useReadAigcFactoryModelIndexCurrent({
    address: aigcFactory,
  });

  const {
    writeContract: createAigc,
    isPending,
    isError,
    error,
  } = useWriteAigcFactoryCreateAigc();

  useWatchAigcFactoryAigcCreatedEvent({
    address: aigcFactory,
    onLogs: (log) => {
      console.debug(log);
      // TODO: event should include model index so that we don't guess
      router.push(`/model/${Number(modelIndex) + 1}/detail`);
    },
  });

  const { control, register, handleSubmit, watch } = useForm<IFormModelInput>();
  const fileInputRef = React.useRef<HTMLInputElement>();
  const selectedFile = watch("file");
  const onSubmit: SubmitHandler<IFormModelInput> = async (data) => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    if (!aigcFactory) {
      console.error("AIGCFactory address not found");
      return;
    }

    setIsSubmitting(true);
    setIsGenerating(true);

    createAigc({
      address: aigcFactory,
      // string memory _modelName, string memory _modelSymbol, uint256 _tokenPrice, uint256 _costToken, bytes32 _aiModelVm, uint256 _ownerReservePercent, uint96 _royalty
      args: [
        data.name,
        data.tokenSymbol,
        parseEther(data.tokenInitialPrice),
        BigInt(0),
        "0x7465787400000000000000000000000000000000000000000000000000000000",
        BigInt(data.tokenOwnerReservePercentage),
        BigInt(data.tokenRoyaltyShare),
        // "Stable Diffusion",
        // "SD",
        // BigInt(0),
        // BigInt(1),
        // "0x7465787400000000000000000000000000000000000000000000000000000000",
        // "0xfEBfdE43561Bc74e4F982cdEB40A29966708E035",
        // BigInt(1000),
        // BigInt(10),
        // BigInt(10),
      ],
    });

    setIsSubmitting(false);
  };

  if (isError) {
    setIsGenerating(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <TextInput
        label="Name of Model"
        placeholder="Model Name"
        name="name"
        required
        register={register}
      />

      <label className="form-control w-full">
        <div className="label">
          <span className="label-text">Description</span>
        </div>
        <textarea
          className="textarea textarea-bordered h-24"
          placeholder="Describe your model"
          {...register("description")}
        ></textarea>
      </label>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Controller
            name="file"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <>
                <input
                  ref={(e) => {
                    field.ref(e);
                    if (e) {
                      fileInputRef.current = e;
                    }
                  }}
                  type="file"
                  hidden
                  onChange={(e) => field.onChange(e.target.files)}
                />
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">
                      Upload your model file to 7007
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload File
                  </button>
                </label>
              </>
            )}
          />
          {selectedFile && selectedFile.length > 0 && (
            <div>Selected file: {selectedFile[0].name}</div>
          )}
        </div>
        <TextInput
          label="Token Symbol"
          name="tokenSymbol"
          required
          register={register}
        />
        <TextInput
          label="Total Supply"
          name="tokenTotalSupply"
          required
          register={register}
        />
        <TextInput
          label="Initial Price"
          postfix="ETH"
          name="tokenInitialPrice"
          required
          register={register}
        />
        <TextInput
          label="Royalty Share"
          postfix="%"
          name="tokenRoyaltyShare"
          required
          register={register}
        />
        <TextInput
          label="Owner Reserve Percentage"
          postfix="%"
          name="tokenOwnerReservePercentage"
          required
          register={register}
        />
      </div>

      <div>
        <button
          disabled={isPending || isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner"></span>
              loading
            </>
          ) : (
            "Publish"
          )}
        </button>
        {isError && (
          <div className="overflow-x-auto whitespace-break-spaces">
            Error: {error?.message}
          </div>
        )}
      </div>
    </form>
  );
}
