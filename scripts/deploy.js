  const { ethers } = require("hardhat");
  require("dotenv").config({ path: ".env" });

  async function main() {
    // URL from where we can extract the metadata for a LW3Punks
    const metadataURL = "ipfs://QmdchAH6U2ibTFobSPmwuQgBGhgShZyknN9v3Epn35ke6o/";
    const imagesURL = "ipfs://QmRtVpuCJ2BsTXrdGZiuX16Mj7MywM15Kf7ekNSpdeFME2/";
    /*
    A ContractFactory in ethers.js is an abstraction used to deploy new smart contracts,
    so lw3PunksContract here is a factory for instances of our LW3Punks contract.
    */
    const lw3PunksContract = await ethers.getContractFactory("WaseePunks");

    // deploy the contract
    const deployedLW3PunksContract = await lw3PunksContract.deploy(metadataURL, imagesURL);

    await deployedLW3PunksContract.deployed();

    // print the address of the deployed contract
    console.log("LW3Punks Contract Address:", deployedLW3PunksContract.address);
  }

  // Call the main function and catch if there is any error
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
