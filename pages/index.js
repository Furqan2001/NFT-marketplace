import { ethers } from "ethers";
import { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import axios from "axios";
import Image from "next/image";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";
// import { nftaddress, nftMarketAddress } from "../config";

export default function Home() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNfts();
  }, []);

  async function loadNfts() {
    const provider = new ethers.providers.JsonRpcProvider(
      "https://rpc-mumbai.matic.today"
    );
    const tokenContract = new ethers.Contract(
      process.env.NFT_ADDRESS,
      NFT.abi,
      provider
    );
    const NFTMarketContract = new ethers.Contract(
      process.env.NFT_MARKET.ADDRESS,
      NFTMarket.abi,
      provider
    );
    const data = await NFTMarketContract.fetchAllNFTs();

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

  async function buyNft(nft) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);

    const signer = provider.getSigner();
    const nftMarketContract = new ethers.Contract(
      process.env.NFT_MARKET_ADDRESS,
      NFTMarket.abi,
      signer
    );

    const price = ethers.utils.parseUnits(nft.price.toString(), "ether");
    const transaction = await nftMarketContract.createMarketSale(
      process.env.NFT_ADDRESS,
      nft.itemId,
      { value: price }
    );
    await transaction.wait();
    loadNfts();
  }

  if (!loading && !nfts.length) {
    return <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>;
  }

  return (
    <div className="flex justify-start ml-2">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {nfts.map((nft) => (
            <div
              key={nft.itemId}
              className="border shadow rounded-xl overflow-hidden"
            >
              <Image
                src={nft.image}
                width="380px"
                height="270px"
                quality="90"
                alt={nft.itemId}
              />
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-2xl font-semibold"
                >
                  {nft.name}
                </p>
                <div style={{ height: "70px", overflow: "hidden" }}>
                  <p className="text-gray-400">{nft.description}</p>
                </div>
              </div>
              <div className="p-4 bg-black">
                <p className="text-2xl mb-4 font-bold text-white">
                  {nft.price} Matic
                </p>
                <button
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-12 rounded"
                  onClick={() => buyNft(nft)}
                >
                  Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
