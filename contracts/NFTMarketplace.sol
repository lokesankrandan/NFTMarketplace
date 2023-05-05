// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplace is ReentrancyGuard, Ownable {
    struct Listing {
        uint256 price;
        address seller;
    }

    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 tokenId,
        uint256 price
    );
    event ItemCanceled(
        address indexed seller,
        address indexed nftAddress,
        uint256 tokenId
    );
    event ItemBought(
        address indexed buyer,
        address indexed seller,
        address indexed nftAddress,
        uint256 tokenId,
        uint256 price
    );

    mapping(address => mapping(uint256 => Listing)) private s_listings; // nftAddress to tokenId to Listing
    mapping(address => uint256) private s_proceeds;                     // userAddress to balance

    modifier notListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        require(listing.price <= 0, "Already listed!");
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        require(listing.price > 0, "Not listed!");
        _;
    }

    modifier isOwner(address nftAddress, uint256 tokenId, address addr) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        require(addr == owner, "Not owner!");
        _;
    }

    /////////////// MAIN FUNCTIONS ///////////////

    function listItem(address nftAddress, uint256 tokenId, uint256 price)
        external
        notListed(nftAddress, tokenId)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        require(price > 0, "Price must be above zero!");
        IERC721 nft = IERC721(nftAddress);
        nft.transferFrom(msg.sender, address(this), tokenId);
        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function cancelListing(address nftAddress, uint256 tokenId)
        external
        isOwner(nftAddress, tokenId, address(this))
        isListed(nftAddress, tokenId)
    {
        IERC721 nft = IERC721(nftAddress);
        nft.transferFrom(address(this), msg.sender, tokenId);
        s_listings[nftAddress][tokenId] = Listing(0, msg.sender);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    function buyItem(address nftAddress, uint256 tokenId)
        external
        payable
        isListed(nftAddress, tokenId)
        nonReentrant
    {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        require(msg.value >= listedItem.price, "Price not met!");
        s_proceeds[listedItem.seller] += msg.value;
        IERC721(nftAddress).transferFrom(address(this), msg.sender, tokenId);
        s_listings[nftAddress][tokenId] = Listing(0, msg.sender);
        emit ItemBought(msg.sender, listedItem.seller, nftAddress, tokenId, listedItem.price);
    }

    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];
        require(proceeds > 0, "No proceeds!");
        s_proceeds[msg.sender] = 0;
        bool success = payable(msg.sender).send(proceeds);
        require(success, "Transfer failed");
    }

    function withdrawFunds() external onlyOwner {
        uint256 balance =  address(this).balance;
        require(balance > 0, "NFTMarket: balance is zero");
        bool success = payable(msg.sender).send(balance);
        require(success, "Transfer failed");
    }

    function getListing(address nftAddress, uint256 tokenId) external view returns (Listing memory) {
        return s_listings[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }
}