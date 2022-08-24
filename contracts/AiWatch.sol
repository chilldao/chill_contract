// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract AiWatchNFT is Initializable, ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721BurnableUpgradeable, OwnableUpgradeable {
    string public _buri;

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
      uint256 []tMaxCnt;
      uint256 []tCnt;
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

    function addMintAddr(address to, uint256 expireTs, uint256 maxCnt,
                         uint256 startId, uint256 endId, uint256[] memory tMaxCnt)
                         external onlyOwner {
        require(tMaxCnt.length == MaxType + 1, "tMaxCnt length error");
        minerControl storage m = _miners[to];
        m.expireTs = expireTs;
        m.maxCnt = maxCnt;
        m.currentCnt = 0;
        m.startId = startId;
        m.endId = endId;
        delete m.tMaxCnt;
        delete m.tCnt;
        for (uint256 index = 0; index < tMaxCnt.length; index++) {
          m.tMaxCnt.push(tMaxCnt[index]);
          m.tCnt.push(0);
        }
    }

    function platformMint(address to, uint256 tokenId, uint256 t) external {
        minerControl storage m = _miners[msg.sender];
        require(block.timestamp < m.expireTs, "mint not allowed or permission has expired");
        require(m.currentCnt < m.maxCnt, "The number of mint has been used up");
        require(m.startId <= tokenId && tokenId <= m.endId , "mint is out of allowable range");
        require(t <= MaxType, "t error");
        require(m.tCnt[t] < m.tMaxCnt[t], "The type is full");
        _safeMint(to, tokenId);
        m.currentCnt++;
        m.tCnt[t]++;
        property storage p = _properties[tokenId];
        p.t = t;
    }
}

