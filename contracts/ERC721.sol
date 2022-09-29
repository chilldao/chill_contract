// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721Enumerable, ERC721Burnable, Ownable {
    string private _buri;

    event SetBaseURI(string uri);

    constructor(string memory name, string memory symbol)
        ERC721(name, symbol) {}

    function _baseURI() internal view override returns (string memory) {
        return _buri;
    }

    function setBaseURI(string memory buri) external onlyOwner {
        _buri = buri;
        emit SetBaseURI(buri);
    }

    function mint(address to, uint256 tokenId) external onlyOwner {
        _safeMint(to, tokenId);
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
