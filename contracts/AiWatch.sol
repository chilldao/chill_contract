// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract AiWatchNFT is Initializable, ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721BurnableUpgradeable, OwnableUpgradeable {
    string private _buri;

    uint8 private constant MaxType = 4;

    struct property {
      uint256 t; //type
    }

    mapping (uint256=>property) public _properties;

    struct minerControl {
      uint256 expireTs;
      uint256 maxCnt ;
      uint256 currentCnt ;
      uint256 startId;
      uint256 endId;
    }
    mapping (address=>minerControl) public _miners;
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() initializer public {
        __ERC721_init("AiWatchNFT", "AiWatch");
        __ERC721Enumerable_init();
        __ERC721Burnable_init();
        __Ownable_init();
    }

    function _baseURI() internal view override returns (string memory) {
        return _buri;
    }

    function setBaseURI(string memory buri) external onlyOwner {
        _buri = buri;
    }

    function mint(address to, uint256 tokenId, uint256 t) external onlyOwner {
        require(t <= MaxType, "t error");
        _safeMint(to, tokenId);
        property storage p = _properties[tokenId];
        p.t = t;
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function addMintAddr(address to, uint256 expireTs, uint256 maxCnt, uint256 startId, uint256 endId) external onlyOwner {
        minerControl storage c = _miners[to];
        c.expireTs = expireTs;
        c.maxCnt = maxCnt;
        c.currentCnt = 0;
        c.startId = startId;
        c.endId = endId;
    }

    function platformMint(address to, uint256 tokenId, uint256 t) external {
        minerControl storage c = _miners[to];
        require(block.timestamp < c.expireTs, "mint permission has expired");
        require(c.currentCnt < c.maxCnt, "The number of mint has been used up");
        require(c.startId <= tokenId && tokenId <= c.endId , "mint is out of allowable range");
        require(t <= MaxType, "t error");
        _safeMint(to, tokenId);
        c.currentCnt++;
        property storage p = _properties[tokenId];
        p.t = t;
    }
}

