// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract BasicNFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private tokenIdCount;

    event NftMinted(uint256 indexed tokenId);

    constructor() ERC721("My NFTs", "MNFT") {}

    function mintNft(string calldata tokenURI) public {
        tokenIdCount.increment();
        uint256 currentID = tokenIdCount.current();
        _safeMint(msg.sender, currentID);
        _setTokenURI(currentID, tokenURI);
        emit NftMinted(currentID);
    }

    function getTokenCounter() public view returns (uint256) {
        return tokenIdCount.current();
    }
}