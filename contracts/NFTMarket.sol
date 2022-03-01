//SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    uint256 listingPrice = 0.025 ether;
    address payable owner;

    struct MarketItem {
        uint256 itemId;
        uint256 tokenId;
        address nftContract;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;

    event MarketItemCreated(
        uint256 indexed itemId,
        uint256 indexed tokenId,
        address indexed nftContract,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    constructor() {
        owner = payable(msg.sender);
    }

    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    // Post an NFT for sale
    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "Price must be atleast 1 wei");
        require(
            msg.value >= listingPrice,
            "Price must be equal to Listing Price"
        );

        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        idToMarketItem[itemId] = MarketItem(
            itemId,
            tokenId,
            nftContract,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
            itemId,
            tokenId,
            nftContract,
            msg.sender,
            address(0),
            price,
            false
        );
    }

    // Purchase an NFT
    function createMarketSale(address nftContract, uint256 itemId)
        public
        payable
        nonReentrant
    {
        uint256 tokenId = idToMarketItem[itemId].tokenId;
        uint256 price = idToMarketItem[itemId].price;
        address payable seller = idToMarketItem[itemId].seller;

        require(
            msg.value == price,
            "Please submit the asking price to complete the purchase"
        );
        seller.transfer(msg.value);
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);

        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].sold = true;
        _itemsSold.increment();
        owner.transfer(listingPrice);
    }

    // fetch all created NFTs
    function fetchAllNFTs() public view returns (MarketItem[] memory) {
        uint256 itemCount = _itemIds.current();
        uint256 unsoldItemCount = itemCount - _itemsSold.current();
        uint256 currentIndex = 0;

        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        for (uint256 i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].owner == address(0)) {
                uint256 currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex++;
            }
        }

        return items;
    }

    // fetch NFTs purchased by the user
    function fetchMyPurchasedNFTs() public view returns (MarketItem[] memory) {
        uint256 itemCount = _itemIds.current();
        uint256 myNFTCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].owner == payable(msg.sender)) {
                myNFTCount++;
            }
        }

        MarketItem[] memory items = new MarketItem[](myNFTCount);
        for (uint256 i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].owner == payable(msg.sender)) {
                uint256 currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex++;
            }
        }

        return items;
    }

    // fetch NFTs created by the user
    function fetchNFTsCreated() public view returns (MarketItem[] memory) {
        uint256 itemCount = _itemIds.current();
        uint256 myNFTCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].seller == payable(msg.sender)) {
                myNFTCount++;
            }
        }

        MarketItem[] memory items = new MarketItem[](myNFTCount);
        for (uint256 i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].seller == payable(msg.sender)) {
                uint256 currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex++;
            }
        }

        return items;
    }
}
