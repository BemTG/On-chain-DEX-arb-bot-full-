const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config();

let config,arb,owner,inTrade,balances;
const network = hre.network.name;
if (network === 'aurora') config = require('./../config/aurora.json');
if (network === 'fantom') config = require('./../config/fantom.json');

console.log(`Loaded ${config.routes.length} routes`);

const main = async () => {
  await setup();
  await loadData();
  await lookForDualTrade();
}

  const loadData = async () => {
    const tx = await arb.addStables(["0xe91d153e0b41518a2ce8dd3d7944fa863463a97d","0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb"]);
    tx.wait();
    const tx2 = await arb.addTokens(["0xdfc20AE04ED70bd9c7D720F449eEDAe19F659D65","0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1","0xe91d153e0b41518a2ce8dd3d7944fa863463a97d"]);
    tx2.wait();
    console.log('All done loading routes in to smart contract');
  }

  //function instaSearch(address _router, address _baseAsset, uint256 _amount) external view returns (uint256,address,address,address) {
  //function instaTrade(address _router1, address _token1, address _token2, address _token3, address _token4, uint256 _amount) external onlyOwner {

const lookForDualTrade = async () => {
  const router1 = config.routers[Math.floor(Math.random()*config.routers.length)].address;
  const baseAsset = config.baseAssets[Math.floor(Math.random()*config.baseAssets.length)].address;
  const tradeSize = balances[baseAsset].balance;
  try {
    const returnArray = await arb.instaSearch(router1, baseAsset, tradeSize);
    const amtBack = returnArray[0];
    const token2 = returnArray[1];
    const token3 = returnArray[2];
    const token4 = returnArray[4];
    const multiplier = ethers.BigNumber.from(config.minBasisPointsPerTrade+10000);
    const sizeMultiplied = tradeSize.mul(multiplier);
    const divider = ethers.BigNumber.from(10000);
    const profitTarget = sizeMultiplied.div(divider);
    if (amtBack.gt(profitTarget)) {
      await dualTrade(router1,baseAsset,token2,token3,token4,tradeSize);
    } else {
      await lookForDualTrade();
    }
  } catch (e) {
    console.log(e);
    await lookForDualTrade();	
  }
}

const dualTrade = async (router1,baseAsset,token2,token3,token4,tradeSize) => {
  if (inTrade === true) {
    await lookForDualTrade();	
    return false;
  }
  try {
    inTrade = true;
    console.log('> Making dualTrade...');
    const tx = await arb.connect(owner).instaTrade(router1,baseAsset,token2,token3,token4,tradeSize);
    await tx.wait();
    inTrade = false;
    await lookForDualTrade();
  } catch (e) {
    console.log(e);
    inTrade = false;
    await lookForDualTrade();
  }
}

const setup = async () => {
  [owner] = await ethers.getSigners();
  console.log(`Owner: ${owner.address}`);
  const IArb = await ethers.getContractFactory('InstaArb');
  arb = await IArb.attach(config.arbContract);
  balances = {};
  for (let i = 0; i < config.baseAssets.length; i++) {
    const asset = config.baseAssets[i];
    const interface = await ethers.getContractFactory('WETH9');
    const assetToken = await interface.attach(asset.address);
    const balance = await assetToken.balanceOf(config.arbContract);
    console.log(asset.sym, balance.toString());
    balances[asset.address] = { sym: asset.sym, balance, startBalance: balance };
  }
  setTimeout(() => {
    setInterval(() => {
      logResults();
    }, 600000);
    logResults();
  }, 120000);
}

const logResults = async () => {
  console.log(`############# LOGS #############`);
    for (let i = 0; i < config.baseAssets.length; i++) {
    const asset = config.baseAssets[i];
    const interface = await ethers.getContractFactory('WETH9');
    const assetToken = await interface.attach(asset.address);
    balances[asset.address].balance = await assetToken.balanceOf(config.arbContract);
    const diff = balances[asset.address].balance.sub(balances[asset.address].startBalance);
    const basisPoints = diff.mul(10000).div(balances[asset.address].startBalance);
    console.log(`#  ${asset.sym}: ${basisPoints.toString()}bps`);
  }
}

process.on('uncaughtException', function(err) {
  console.log('UnCaught Exception 83: ' + err);
  console.error(err.stack);
  fs.appendFile('./critical.txt', err.stack, function(){ });
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: '+p+' - reason: '+reason);
});

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
