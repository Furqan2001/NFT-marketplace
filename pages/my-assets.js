import { ethers } from "ethers";
import { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import axios from "axios";
import Image from "next/image";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";
import { nftaddress, nftMarketAddress } from "../config";

export default function Home() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNfts();
  }, []);

  async function loadNfts() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
    const NFTMarketContract = new ethers.Contract(
      nftMarketAddress,
      NFTMarket.abi,
      signer
    );
    const data = await NFTMarketContract.fetchMyPurchasedNFTs();

    const items = await Promise.all(
      data.map(async (nft) => {
        const tokenURI = await tokenContract.tokenURI(nft.tokenId);
        const meta = await axios.get(tokenURI);
        const price = ethers.utils.formatUnits(nft.price.toString(), "ether");
        return {
          price,
          itemId: nft.itemId.toNumber(),
          seller: nft.seller,
          owner: nft.owner,
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description
        };
      })
    );
    setNfts(items);
    setLoading(false);
  }

  if (!loading && !nfts.length) {
    return <h1 className="px-20 py-10 text-3xl">No assets bought</h1>;
  }

  return (
    <div className="flex justify-center">
      <div className="p-4 ml-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {nfts.map((nft, i) => (
            <div key={i} className="border shadow rounded-xl overflow-hidden">
              <Image
                src={nft.image}
                className="rounded"
                width="420px"
                height="330px"
                alt={nft.itemId}
              />
              <div className="p-4 bg-black">
                <p className="text-2xl font-bold text-white">
                  Price - {nft.price} Matic
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
