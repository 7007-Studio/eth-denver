import React, { RefObject, useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Image from "next/image";
import {
  UseWriteContractParameters,
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Abi, Address, erc721Abi, parseEther } from "viem";
import { useConnectModal } from "@rainbow-me/rainbowkit";

import { NATIVE_TOKEN_ADDRESS } from "@/constants";
import { getContractAddress } from "@/helpers";
import {
  useReadAigcGetApproved,
  useWriteAigcApprove,
  useWriteAigcSetApprovalForAll,
  useWriteMarketplaceV3CreateListing,
} from "@/generated";
import { Metadata } from "@/types";

import TextInput from "../textInput";
import { WriteContractVariables } from "wagmi/query";

export interface ListingNFT {
  address: Address;
  tokenId: bigint;
  maxQuantity?: number;
  metadata?: Partial<Metadata>;
}

interface IFormListNFTInput {
  price: string;
  duration: number;
  quantity: number;
}

interface ListingNFTModalProps {
  listingNFT?: ListingNFT;
  listingSuccess?: () => void;
}

const ListingNFTModal = React.forwardRef(
  ({ listingNFT, listingSuccess }: ListingNFTModalProps, ref) => {
    const { isConnected, chainId } = useAccount();
    const { openConnectModal } = useConnectModal();

    const [approvedListing, setApprovedListing] = useState(false);
    const [listInitialized, setListInitialized] = useState(false);
    const [isListed, setIsListed] = useState(false);

    useEffect(() => {
      reset();
      setApprovedListing(false);
      setListInitialized(false);
      setIsListed(false);
    }, [listingNFT]);

    const { register, handleSubmit, getValues, reset } =
      useForm<IFormListNFTInput>();
    const onSubmit: SubmitHandler<IFormListNFTInput> = async (data) => {
      console.debug("submit data", data);

      if (!isConnected || !chainId) {
        openConnectModal?.();
        return;
      }

      const marketplaceV3 = getContractAddress("MarketplaceV3", chainId);
      if (!marketplaceV3) return;

      if (!listingNFT) {
        return;
      }

      if (!approvedListing) {
        console.debug("submit data", data);

        setListInitialized(true);
        approveListing(
          {
            address: listingNFT?.address as Address,
            abi: erc721Abi,
            functionName: "setApprovalForAll",
            args: [marketplaceV3, true],
          },
          {
            onError(error) {
              console.debug("approveListing onError", error);
              setListInitialized(false);
            },
          }
        );
      } else {
        createListingWrapper(data);
      }
    };

    // read contracts
    const { data: approved } = useReadAigcGetApproved({
      address: listingNFT?.address,
      args: listingNFT ? [BigInt(listingNFT?.tokenId)] : undefined,
    });
    // setApprovedListing(approved);

    // write contracts
    const { writeContract: approveListing, data: approveTx } =
      useWriteContract();
    // useWriteAigcSetApprovalForAll();

    const { writeContract: createListing, data: createListingTx } =
      useWriteMarketplaceV3CreateListing();

    // wait for transactions
    const approveResult = useWaitForTransactionReceipt({
      hash: approveTx,
    });
    useEffect(() => {
      console.debug("approveResult refreshed");
      if (!approveResult.isSuccess) return;

      setApprovedListing(true);
      setListInitialized(false);
    }, [approveResult]);

    const listingResult = useWaitForTransactionReceipt({
      hash: createListingTx,
    });
    useEffect(() => {
      console.debug("listingResult refreshed");
      if (!listingResult.isSuccess) return;
      setIsListed(true);
      setApprovedListing(false);
      setListInitialized(false);

      (ref as RefObject<HTMLDialogElement>)?.current?.close();
      listingSuccess?.();
    }, [listingResult]);

    function createListingWrapper(data: IFormListNFTInput) {
      if (!listingNFT) return;
      console.debug("listingNFT", listingNFT);

      const marketplaceV3 = getContractAddress("MarketplaceV3", chainId);
      if (!marketplaceV3) return;

      setListInitialized(true);

      const createListingArgsTuple: {
        assetContract: Address;
        tokenId: bigint;
        quantity: bigint;
        currency: Address;
        pricePerToken: bigint;
        startTimestamp: bigint;
        endTimestamp: bigint;
        reserved: boolean;
      } = {
        assetContract: listingNFT.address,
        tokenId: BigInt(listingNFT.tokenId),
        quantity: BigInt(data.quantity) || 1n,
        currency: NATIVE_TOKEN_ADDRESS,
        pricePerToken: parseEther(data.price),
        startTimestamp: BigInt(Math.round(Date.now() / 1000)),
        endTimestamp: BigInt(
          Math.round(Date.now() / 1000) + data.duration * 24 * 60 * 60
        ),
        reserved: false,
      };

      console.debug("createListingArgsTuple", createListingArgsTuple);
      createListing(
        {
          address: marketplaceV3,
          args: [createListingArgsTuple],
        },
        {
          onError(error) {
            console.error(error);
            setListInitialized(false);
          },
        }
      );
    }

    return (
      <dialog
        ref={ref as RefObject<HTMLDialogElement> | null}
        id="listingNFTModal"
        className="modal"
      >
        <div className="modal-box max-w-[424px] bg-white">
          {!isListed ? (
            <>
              <h3 className="heading-md">Listing NFT</h3>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-6"
              >
                <div>
                  <div className="label">
                    <span className="label-text">Name</span>
                  </div>
                  <div className="text-lg">{listingNFT?.metadata?.name}</div>
                </div>
                <TextInput
                  label="Price"
                  postfix="eth"
                  name="price"
                  placeholder="0.00"
                  required
                  register={register}
                />
                <TextInput
                  label="Duration"
                  postfix="Days"
                  name="duration"
                  placeholder="0"
                  min={1}
                  max={7}
                  required
                  register={register}
                />
                <TextInput
                  label="Quantity"
                  name="quantity"
                  placeholder="1"
                  min={1}
                  max={listingNFT?.maxQuantity || 1}
                  required
                  register={register}
                />
                <span className="text-sm">
                  You can set a maximum of 7 days.
                </span>
                <div className="flex flex-row gap-4">
                  <div className="flex-1">
                    <button
                      type="button"
                      className="btn btn-secondary w-full"
                      onClick={() => {
                        (ref as RefObject<HTMLDialogElement>)?.current?.close();
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex-1">
                    <button
                      disabled={listInitialized}
                      className="btn btn-primary w-full"
                    >
                      {listInitialized ? (
                        <>
                          <span className="loading loading-spinner"></span>
                          loading
                        </>
                      ) : approvedListing ? (
                        "List"
                      ) : (
                        "Approve Listing"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col justify-center items-center gap-10">
              <Image
                src="/check.svg"
                alt="NFT listed"
                width={120}
                height={120}
              />
              <div className="px-4 text-center">
                <h2 className="heading-md">
                  Your NFT was listed successfully!
                </h2>
              </div>
              <button
                type="button"
                className="btn btn-secondary w-full"
                onClick={() => {
                  (ref as RefObject<HTMLDialogElement>)?.current?.close();
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </dialog>
    );
  }
);
ListingNFTModal.displayName = "ListingNFTModal";

export default ListingNFTModal;
