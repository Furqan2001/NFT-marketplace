import { useState } from "react";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import Spinner from "../components/Spinner";
import { useRouter } from "next/router";
import Image from "next/image";

// import { nftaddress, nftMarketAddress } from "../config";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

function CreateItem() {
  const router = useRouter();
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, updateFormInput] = useState({
    name: "",
    description: "",
    price: ""
  });
  const [uploadingImageStatus, setuploadingImageStatus] = useState(false);
  const [submissionStatus, updateSubmissionStatus] = useState(false);

  async function onChange(e) {
    const file = e.target.files[0];
    try {
      setuploadingImageStatus(true);
      const added = await client.add(file, {
        progress: (prog) => console.log(`received ${prog}`)
      });
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      setuploadingImageStatus(false);
      setFileUrl(url);
    } catch (err) {
      setuploadingImageStatus(false);
      console.log(err);
    }
  }

  async function createMarketItem() {
    const { name, description, price } = formInput;
    if (!name || !description || !price || !fileUrl) return;
    const data = JSON.stringify({ name, description, image: fileUrl });

    updateSubmissionStatus(true);
    try {
      const added = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      postItem(url);
    } catch (err) {
      console.log(err);
    }
  }

  async function postItem(url) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    let transaction;
    let contract = new ethers.Contract(
      process.env.NFT_ADDRESS,
      NFT.abi,
      signer
    );
    try {
      transaction = await contract.createToken(url);
    } catch (err) {
      return updateSubmissionStatus(false);
    }

    const tx = await transaction.wait();
    const event = tx.events[0];
    const value = event.args[2];
    const tokenId = value.toNumber();

    contract = new ethers.Contract(
      process.env.NFT_MARKET_ADDRESS,
      NFTMarket.abi,
      signer
    );
    let listingPrice = await contract.getListingPrice();
    listingPrice = listingPrice.toString();

    const price = ethers.utils.parseUnits(formInput.price, "ether");

    try {
      transaction = await contract.createMarketItem(
        process.env.NFT_ADDRESS,
        tokenId,
        price,
        {
          value: listingPrice
        }
      );
    } catch (err) {
      return updateSubmissionStatus(false);
    }
    await transaction.wait();
    updateSubmissionStatus(false);
    router.push("/");
  }

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input
          placeholder="Asset Name"
          className="mt-8 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, name: e.target.value })
          }
        />
        <textarea
          placeholder="Asset Description"
          className="mt-2 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, description: e.target.value })
          }
        />
        <input
          placeholder="Asset Price in Matic"
          className="mt-2 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, price: e.target.value })
          }
        />
        <input type="file" name="Asset" className="my-4" onChange={onChange} />
        <div>
          {uploadingImageStatus ? (
            <Spinner />
          ) : (
            fileUrl && (
              <Image
                className="rounded mt-4"
                width="335px"
                height="240px"
                src={fileUrl}
                alt={""}
              />
            )
          )}
        </div>
        <button
          onClick={createMarketItem}
          className="font-bold mt-4 bg-pink-500 hover:bg-pink-600 disabled:bg-slate-400 text-white rounded p-4 shadow-lg"
          disabled={submissionStatus}
        >
          Create Digital Asset
        </button>
      </div>
    </div>
  );
}

export default CreateItem;
