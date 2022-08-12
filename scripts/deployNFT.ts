import { ethers } from "hardhat";

async function main() {

    const Contract = await ethers.getContractFactory("NFT");
    const symbol = "Chip"
    // const symbol = "Cpu"
    const name = symbol + "NFT"
    const contract = await Contract.deploy(name, symbol);
    // const contract = await Contract.deploy("CpuNFT", "Cpu");

    await contract.deployed();

    console.log(symbol + " address:", contract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
