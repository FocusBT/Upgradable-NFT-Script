
const hre = require("hardhat");
const pinataSDK = require('@pinata/sdk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require("canvas");

const pinata = new pinataSDK({ pinataApiKey: '', pinataSecretApiKey: '' });
var updatedImageCID;
var updatedMetadataCID;

async function createNftImage(nftId, size, logoPath) {
  const logo = await loadImage(logoPath);
  console.log(logo)

  const canvasWidth = 600;
  const canvasHeight = 600;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // Fill background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw NFT id
  const fontSize = 150;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.fillText(nftId, canvasWidth / 2, canvasHeight / 2 + fontSize / 3);

  // Draw NFT name
  const nameFontSize = 50;
  ctx.font = `${nameFontSize}px sans-serif`;
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.fillText(size, canvasWidth / 2, canvasHeight - 60);

  // Draw logo
  const logoSize = 75;
  const logoMargin = 25;
  const logoX = canvasWidth - logoSize - logoMargin;
  const logoY = logoMargin;
  ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

  // Draw border
  const borderWidth = 10;
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(
    borderWidth / 2,
    borderWidth / 2,
    canvasWidth - borderWidth,
    canvasHeight - borderWidth
  );

  const imageBuffer = canvas.toBuffer("image/png");

  return imageBuffer;
}

function createNftMetadata(id, name, description, imageCID) {
  const str = toString(id);
  console.log(str)
  return new Promise((resolve, reject) => {
    const metadata = {
      name: id,
      description: description,
      image: `${imageCID}${id}.png`
    };
    const metadataFileName = `${id}.json`;
    const metadataPath = path.join(__dirname, 'metadata', metadataFileName);
    fs.writeFile(metadataPath, JSON.stringify(metadata), (err) => {
      if (err) {
        reject(`Error creating NFT metadata: ${err}`);
      } else {
        console.log(`Created NFT metadata at ${metadataPath}`);
        resolve(metadataPath);
      }
    });
  });
}

function updateMetadataLink(link, numFiles) {
  for (let i = 1; i <= numFiles; i++) {
    const fileName = `${i}.json`;
    const filePath = path.join(__dirname, 'metadata', fileName);
    const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    metadata.image = `${link}${i}.png`;
    fs.writeFileSync(filePath, JSON.stringify(metadata));
  }
}

async function uploadToPinata(nftFolder, options) {
  try {
    const result = await pinata.pinFromFS(nftFolder, options);
    console.log(`Folder ${nftFolder} uploaded to IPFS with CID ${result.IpfsHash}`);
    return result.IpfsHash;
  } catch (err) {
    console.error(`Error uploading ${nftFolder} to IPFS: ${err}`);
    throw err;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {

  
 
  const NFTcontract = await hre.ethers.getContractFactory("WaseePunks");
  const address = "0x8a89a64d040f2F2bd6bdcC16CA0D8e4E31da45b1";
  const contract = await NFTcontract.attach(address);

  //             MINT FIRST
  // const amountToSend = ethers.utils.parseEther("0.01"); // 1 ether 
  // const nameT = await contract.mint({value: amountToSend});

  const Wholecid = await contract.tokenURI(1);
  const ICID = await contract.getImageCID();
  const start_index = "ipfs://".length; // get the index where the hash starts
  const end_index = Wholecid.indexOf("/", start_index); // find the index of the first forward slash after the hash
  const MetaDatacid = Wholecid.slice(start_index, end_index);
  const ImagesCID = ICID.slice(start_index, end_index);
  console.log("Metadata CID:", MetaDatacid);
  console.log("Images CID:", ImagesCID);

  const maxTokens = await contract.functions.maxTokenIds();
  console.log(Number(maxTokens));


  const dirPath = path.join(__dirname, 'metadata');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }

  for (let i = 1; i <= Number(maxTokens); i++) {
    // axios.get(`https://gateway.pinata.cloud/ipfs/${MetaDatacid}/${i}.json`)
    axios.get(`https://cloudflare-ipfs.com/ipfs/${MetaDatacid}/${i}.json`)
    // https://cloudflare-ipfs.com/ipfs/QmdchAH6U2ibTFobSPmwuQgBGhgShZyknN9v3Epn35ke6o/
    .then(response => {
      const data = response.data;
      const jsonString = JSON.stringify(data);

      fs.writeFile(path.join(dirPath, `${i}.json`), jsonString, err => {
        if (err) {
          console.error(`Failed to write file: ${err}`);
          return;
        }
        console.log('File saved successfully!');
      });
    })
    .catch(error => {
      console.error(`Failed to download file with CID ${MetaDatacid}: ${error}`);
    });
  }

  const dirPath2 = path.join(__dirname, 'NFTs');
  if (!fs.existsSync(dirPath2)) {
    fs.mkdirSync(dirPath2);
  }

  for (let i = 1; i <= Number(maxTokens); i++) {
    axios.get(`https://ipfs.io/ipfs/${ImagesCID}/${i}.png`, { responseType: 'arraybuffer' })
      .then(response => {
        const data = response.data;
        fs.writeFile(path.join(dirPath2, `${i}.png`), Buffer.from(data), err => {
          if (err) {
            console.error(`Failed to write file: ${err}`);
            return;
          }
          console.log(`File ${i} saved`);
        });
      })
      .catch(error => {
        console.error(`Failed to download file with CID ${ImagesCID}: ${error}`);
      });
  }

  createNftImage("G-13", "12 acers", "scripts/bahria.jpg")
  .then((image) => {
    const filename = `scripts/NFTs/${(Number(maxTokens)+1)}.png`;
    fs.writeFileSync(filename, image);
    console.log(`Saved NFT image to ${filename}.`);
  })
  .catch((error) => {
    console.error(error);
  });

  await delay(3000); // Wait for 2000 milliseconds


  const nftFolder = 'scripts/NFTs';
  const options1 = {
    pinataMetadata: {
      name: 'NFTs',
      keyvalues: {
        customKey: 'customValue'
      }
    },
    pinataOptions: {
      cidVersion: 0
    }
  };
  updatedImageCID = await uploadToPinata(nftFolder, options1);
  
  
  
  updatedImageCID = `ipfs://${updatedImageCID}/`;
  await delay(3000); 

  updateMetadataLink(updatedImageCID, Number(maxTokens))
  console.log(updatedImageCID);

  createNftMetadata(Number(maxTokens)+1, "Bahria Town", "This is very large property", updatedImageCID);

  

  // // //  
  const metadataFolder = 'scripts/metadata';
  const options2 = {
    pinataMetadata: {
      name: 'metadata',
      keyvalues: {
        customKey: 'customValue'
      }
    },
    pinataOptions: {
      cidVersion: 0
    }
  };
  updatedMetadataCID = await uploadToPinata(metadataFolder, options2);
  updatedMetadataCID = `ipfs://${updatedMetadataCID}/`;
  console.log(updatedMetadataCID)
  await contract.setBaseURI(updatedMetadataCID, updatedImageCID)


  // //              IT WILL DELETTE THE WHOLE FILE
  // pinata.unpin(ImagesCID).then(response => {         
  //   console.log(response);
  // }).catch(error => {
  //   console.log(error);
  // });

// //              IT WILL DELETTE THE WHOLE FILE
//   pinata.unpin(MetaDatacid).then(response => {         
//     console.log(response);
//   }).catch(error => {
//     console.log(error);
//   });



  


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
