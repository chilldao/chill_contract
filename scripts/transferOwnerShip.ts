import { ethers } from "hardhat";

async function main() {

    const NewOwner = "";
    const Contract = await ethers.getContractFactory("AiWatchNFT");
    const contract = Contract.attach("address");

    const transferOwnershipTx = await contract.transferOwnership(NewOwner);
    console.log("transferOwnership hash: ", transferOwnershipTx.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
