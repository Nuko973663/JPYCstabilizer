/**
 * jpyc stabilizer
 * index.js
 */

"use strict";

import { NukoApi } from "./lib/NukoApi.min.js";
//import { NukoEtc } from "/js/lib/NukoEtc.min.js";

const VERSION_TEXT = "20210922.0";

var nuko = {
  gas: 0,
  gasList: null,
  gasPref: "fastest",
  gasId: 0,
  gasInterval: 15000,
  gasLimit: 300000,
  rate: [],
  rateRaw: [],
  rateId: 0,
  rateInterval: 30000, // RPC nodeに負荷をかけるので短くするのはお控えください Please do not shorten rateInterval. It causes high load of RPC node.
  rateContract: null,
  rateReserveUSDC: [],
  rateReserveJPYC: [],
  rateReserveMATIC: [],
  allowanceUSDC: [],
  allowanceJPYC: [],
  balanceJPYC: 0,
  balanceUSDC: 0,
  balanceMATIC: 0,
  balanceContractJPYC: null,
  balanceContractUSDC: null,
  swapContract: [],
  swapMaxJPYC: 10000,
  swapMinJPYC: 1000,
  swapMaxUSDC: 100,
  swapMinUSDC: 10,
  swapSlippage: [0.006, 0.0075],
  swapGasMax: 300,
  swapLog: [],
  swapMaxLog: 100,
  upperThreshold: 117.9,
  lowerThreshold: 115.9,
  target: 0,
  spread: 2,
  jpyusd: 100,
  jpyusdInterval: 300 * 1000, // 5 min
  jpyusdId: 0,
  flgSwapping: 0,
  wallet: null,
  password: "c04Bef8613730faC95166A970300caC35b1Af883",
  contractRate: [],
  versionInterval: 3600 * 1000, // interval to check latest version: 1 hour
  versionAlertFlag: false,
  keepaliveInterval: 45 * 1000, // interval to get active user number
  reloadAvailableUpdates: false,
  lowerSwapMaticThreshold: 0,
  swapMaticAmount: 0,
  currentWeb3Provider: 0,
};

const NODE_URL = [
  "wss://speedy-nodes-nyc.moralis.io/3e336936ccd6ec0af99dc191/polygon/mainnet/ws",
  "https://speedy-nodes-nyc.moralis.io/3e336936ccd6ec0af99dc191/polygon/mainnet",
  "https://polygon-rpc.com",
];

const contractAddress = {
  JPYC: "0x6ae7dfc73e0dde2aa99ac063dcf7e8a63265108c",
  USDC: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
  MATIC: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
  routerQuick: "0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff",
  pairQuick: "0x205995421C72Dc223F36BbFad78B66EEa72d2677",
  routerSushi: "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506",
  pairSushi: "0xfbae8e2d04a67c10047d83ee9b8aeffe7f6ea3f4",
  pairMATIC_JPYC: "0x7105f0e4a000fae92b1299734b18e7d375968371",
  pairMATIC_USDC: "0x6e7a5fafcec6bb1e78bae2a1f0b612012bf14827",
};

const decimal = {
  JPYC: 18,
  USDC: 6,
  MATIC: 18,
};

const options = {
  timeout: 30000,
  clientConfig: {
    keepalive: true,
    keepaliveInterval: 60000,
  },

  reconnect: {
    auto: true,
    delay: 1000,
    maxAttempts: 5,
    onTimeout: false,
  },
};

var provider = new Web3.providers.WebsocketProvider(NODE_URL[0], options);
var web3 = new Web3(provider);

/**
 * goSwap
 */
const goSwap = async (from, to, amount, minAmount, gas, pool) => {
  let i = pool;
  let table = $("#dataTable").DataTable();
  let timestamp = new Date();
  let dt = timestamp.toLocaleString();
  let gasEstimate = "est. " + (((gas * nuko.gasLimit) / 1e9) * 0.5).toFixed(4);
  let row = table.row.add([
    dt,
    from,
    to,
    nuko.rate[i],
    amount,
    minAmount,
    gasEstimate,
    "",
  ]);
  row.draw();
  table.column("0:visible").order("dsc").draw();

  console.log(minAmount);
  //
  let amountIn = Math.floor(amount * 10 ** decimal[from]) / 10 ** decimal[from];
  amountIn =
    from == "JPYC"
      ? web3.utils.toWei(amountIn.toString())
      : web3.utils.toWei(amountIn.toString(), "mwei");

  let amountOut = Math.floor(minAmount * 10 ** decimal[to]) / 10 ** decimal[to];
  amountOut =
    from == "JPYC"
      ? web3.utils.toWei(amountOut.toString(), "mwei")
      : web3.utils.toWei(amountOut.toString());

  let tokenIn = contractAddress[from];
  let tokenOut = contractAddress[to];
  let link = "";
  let poolImg = i == 0 ? "img/quickswap.png" : "img/sushi.png";
  let poolLink = "<img src='" + poolImg + "' width='20px'/>";

  try {
    await nuko.swapContract[i].methods
      .swapExactTokensForTokens(
        web3.utils.toHex(amountIn),
        web3.utils.toHex(amountOut),
        [tokenIn, tokenOut],
        nuko.wallet[0].address,
        Math.floor(Date.now() / 1000) + 60 * 5
      )
      .send({
        from: nuko.wallet[0].address,
        gasLimit: web3.utils.toHex(nuko.gasLimit),
        gasPrice: web3.utils.toHex(gas * 1e9),
      })
      .once("transactionHash", (hash) => {
        link =
          '<a href="https://polygonscan.com/tx/' +
          hash +
          '" target="_blank">' +
          "TX</a>";
        row
          .data([
            dt,
            from,
            to,
            poolLink + nuko.rate[i],
            amount,
            minAmount,
            gasEstimate,
            link,
          ])
          .draw();
        table.column("0:visible").order("dsc").draw();
      })
      .once("receipt", (receipt) => {
        console.log(receipt);
        let gasUsed = (receipt.gasUsed * gas * 1e9 * 1e-18).toFixed(4);
        link = link + '<i class="fas fa-check-circle"></i>';
        let log = [
          dt,
          from,
          to,
          poolLink + nuko.rate[i],
          amount,
          minAmount,
          gasUsed,
          link,
        ];
        row.data(log).draw();
        table.column("0:visible").order("dsc").draw();
        if (nuko.swapLog.unshift(log) > nuko.swapMaxLog) {
          nuko.swapLog.pop();
        }
        localStorage.swapLog = JSON.stringify(nuko.swapLog);
      });
  } catch (e) {
    link = link + '<i class="fas fa-exclamation-triangle"></i>';
    row
      .data([
        dt,
        from,
        to,
        poolLink + nuko.rate[i],
        amount,
        minAmount,
        gasEstimate,
        link,
      ])
      .draw();
    table.column("0:visible").order("dsc").draw();
    console.log(e);
  }
  nuko.flgSwapping = false;
  getBalance();
};

const updateCommunityBalance = (json, rate) => {
  json.jpycNum = parseFloat(json.jpyc);
  json.usdcNum = parseFloat(json.usdc);
  $("#communityBalanceJPYC").text(
    json.jpycNum.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })
  );
  $("#communityBalanceUSDC").text(
    json.usdcNum.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })
  );

  $("#communityBalanceJPYC2").text(
    json.jpycNum.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })
  );
  $("#communityBalanceUSDC2").text(
    json.usdcNum.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })
  );

  let chart = chartCommunityBalance;

  chart.data.datasets[0].data[0] = json.usdcNum;
  chart.data.datasets[0].data[1] = json.jpyc / rate;

  chart.update();
};

/**
 * watch rate
 */
const watchRate = async () => {
  await getBalance();
  await getRate();

  if ($("#swapSwitch").prop("checked")) {
    //console.log(nuko.rate);

    // QuickSwapとSushiSwapの両方がtrigerされる場合にトライする順番をランダム化する
    let array = [0, 1];
    if (Math.random() > 0.5) {
      array = array.reverse();
    }
    array.forEach((i) => {
      if (
        nuko.rate[i] > nuko.upperThreshold &&
        parseFloat(web3.utils.fromWei(nuko.balanceUSDC, "mwei")) >
          nuko.swapMinUSDC &&
        parseInt(nuko.allowanceUSDC[i]) > 0
      ) {
        if (!nuko.flgSwapping) {
          nuko.flgSwapping = true;
          //console.log("USDC->JPYC");
          let bl =
            parseFloat(web3.utils.fromWei(nuko.balanceUSDC, "mwei")) * 0.99999;
          let amount = bl > nuko.swapMaxUSDC ? nuko.swapMaxUSDC : bl;
          let minAmount = amount * nuko.rate[i] * (1.0 - nuko.swapSlippage[i]);

          goSwap(
            "USDC",
            "JPYC",
            amount,
            minAmount,
            nuko.gas < nuko.swapGasMax ? nuko.gas : nuko.swapGasMax,
            i
          );
        }
      } else if (
        nuko.rate[i] < nuko.lowerThreshold &&
        parseFloat(web3.utils.fromWei(nuko.balanceJPYC)) > nuko.swapMinJPYC &&
        parseInt(nuko.allowanceJPYC[i]) > 0
      ) {
        if (!nuko.flgSwapping) {
          nuko.flgSwapping = true;
          //console.log("JPYC -> USDC");
          let bl = parseFloat(web3.utils.fromWei(nuko.balanceJPYC)) * 0.99999;
          let amount = bl > nuko.swapMaxJPYC ? nuko.swapMaxJPYC : bl;
          let minAmount =
            (amount / nuko.rate[i]) * (1.0 - nuko.swapSlippage[i]);

          goSwap(
            "JPYC",
            "USDC",
            amount,
            minAmount,
            nuko.gas < nuko.swapGasMax ? nuko.gas : nuko.swapGasMax,
            i
          );
        }
      }
    }); // 自動Maticスワップ
    await autoSwapMatic();
  }
  updateLiquidity();
};

const getRate = async () => {
  for (let i = 0; i < 2; i++) {
    await nuko.contractRate[i].methods
      .getReserves()
      .call()
      .then((values) => {
        nuko.rateReserveUSDC[i] = values[0] / 10 ** 6;
        nuko.rateReserveJPYC[i] = values[1] / 10 ** 18;
        nuko.rateRaw[i] = nuko.rateReserveJPYC[i] / nuko.rateReserveUSDC[i];
        nuko.rate[i] =
          Math.floor(nuko.rateRaw[i] * Math.pow(10, 2)) / Math.pow(10, 2);
      });
  }
  $("#rate").text(nuko.rate[0] + " / " + nuko.rate[1]);
  let timestamp = new Date();
  let dt = timestamp.toLocaleString().slice(0, -3);
  chartAddData(dt, [nuko.rate[0], nuko.rate[1]]);
};

const chartAddData = (label, data) => {
  let chart = chartJPYCUSDC;
  chart.data.labels.push(label);
  chart.data.datasets[0].data.push(data[0]);
  chart.data.datasets[1].data.push(data[1]);
  chart.update();
};

const getBalance = async () => {
  web3.eth.getBalance(nuko.wallet[0].address).then((balance) => {
    nuko.balanceMATIC = balance;
    let m = parseFloat(web3.utils.fromWei(balance));
    m = Math.floor(m * Math.pow(10, 4)) / Math.pow(10, 4);
    $("#balanceMATIC").text(
      m.toLocaleString(undefined, {
        maximumFractionDigits: 4,
      })
    );
  });

  nuko.balanceContractJPYC.methods
    .balanceOf(nuko.wallet[0].address)
    .call()
    .then((balance) => {
      nuko.balanceJPYC = balance;
      let m = parseFloat(web3.utils.fromWei(balance));
      m = Math.floor(m * Math.pow(10, 2)) / Math.pow(10, 2);
      $("#balanceJPYC").text(
        m.toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })
      );
    });
  nuko.balanceContractUSDC.methods
    .balanceOf(nuko.wallet[0].address)
    .call()
    .then((balance) => {
      nuko.balanceUSDC = balance;
      let m = parseFloat(web3.utils.fromWei(balance, "mwei"));
      m = Math.floor(m * Math.pow(10, 4)) / Math.pow(10, 4);
      $("#balanceUSDC").text(
        m.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })
      );
      return balance;
    });
};

/**
 * get amount of token allowance for specified smart contract
 * @param {*} contractAddress
 * @param {*} routerAddress
 * @param {*} button
 * @returns
 */
const getAllowance = async (contractAddress, routerAddress, button) => {
  let allowanceContract = new web3.eth.Contract(abiERC20, contractAddress);
  let allowance = 0;
  await allowanceContract.methods
    .allowance(nuko.wallet[0].address, routerAddress)
    .call()
    .then((amount) => {
      if (parseInt(amount) > 0) $(button).addClass("disabled");
      allowance = amount;
    });
  return allowance;
};

/**
 * get allowance for USDC and JPYC and update modal buttons
 */
const updateAllowance = async () => {
  nuko.allowanceUSDC[0] = await getAllowance(
    contractAddress.USDC,
    contractAddress.routerQuick,
    "#approveUSDC0"
  );
  nuko.allowanceJPYC[0] = await getAllowance(
    contractAddress.JPYC,
    contractAddress.routerQuick,
    "#approveJPYC0"
  );
  nuko.allowanceJPYC[1] = await getAllowance(
    contractAddress.JPYC,
    contractAddress.routerSushi,
    "#approveJPYC1"
  );
  nuko.allowanceUSDC[1] = await getAllowance(
    contractAddress.USDC,
    contractAddress.routerSushi,
    "#approveUSDC1"
  );
};

const watchGas = async () => {
  /* yamachang123
#gasPrice に選択中のnuko.gasPrefを明示。（非同期でGasとSwapは行われているため表記と異なるガス代になるため）
*/
  nuko.gas = await getGas();

  $("#gasPrice").text(nuko.gas + " " + nuko.gasPref);
  $("#gasFastest").text(
    "fastest : " + parseInt(nuko.gasList.fastest) + " gwei"
  );
  $("#gasFaster").text("faster : " + parseInt(nuko.gasList.faster) + " gwei");
  $("#gasFast").text("fast : " + parseInt(nuko.gasList.fast) + " gwei");
  $("#gasStandard").text(
    "standard : " + parseInt(nuko.gasList.standard) + " gwei"
  );
  $("#gasSafeLow").text(
    "safelow : " + parseInt(nuko.gasList.safeLow) + " gwei"
  );
};

const getGas = async () => {
  let response = await fetch("https://gasstation-mainnet.matic.network");
  let json = await response.json();
  nuko.gasList = json;
  nuko.gasList.faster =
    (parseInt(nuko.gasList.fastest) + parseInt(nuko.gasList.fast)) / 2;
  let gas = parseInt(json[nuko.gasPref]);
  return gas;
};

const getJPYUSD = async () => {
  let response = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=jpy%2Cusd"
  );
  let json = await response.json();
  let jpyusd = parseInt(json.bitcoin.jpy) / parseInt(json.bitcoin.usd);

  return jpyusd;
};

const watchJPYUSD = async () => {
  nuko.jpyusd = await getJPYUSD();
  $("#jpyusd").text(nuko.jpyusd.toFixed(2));
  updateLimit();
};

const approveCoin = async (tokenContractAddress, spenderAddress, id) => {
  console.log("try approving " + tokenContractAddress);

  let tokenContract = new web3.eth.Contract(abiERC20, tokenContractAddress);

  let tokenDecimals = web3.utils.toBN(18);
  let tokenAmountToApprove = web3.utils.toBN(999000000000);
  let calculatedApproveValue = web3.utils.toHex(
    tokenAmountToApprove.mul(web3.utils.toBN(10).pow(tokenDecimals))
  );

  await tokenContract.methods
    .approve(spenderAddress, calculatedApproveValue)
    .send({
      from: nuko.wallet[0].address,
      gasLimit: web3.utils.toHex(100000),
      gasPrice: web3.utils.toHex(nuko.gasList.fast * 1e9),
    })
    .once("transactionHash", (hash) => {
      $(id).text("sent");
      console.log(hash);
    })
    .once("receipt", (receipt) => {
      console.log(receipt);
      $(id).text("done");
    });
};

const updateLimit = () => {
  //nuko.upperThreshold = nuko.target + nuko.spread / 2;
  //nuko.lowerThreshold = nuko.target - nuko.spread / 2;
  $("#upperLimit").text(nuko.upperThreshold.toFixed(2));
  $("#lowerLimit").text(nuko.lowerThreshold.toFixed(2));
};

const autoSwapMatic = async () => {
  const maticVal = await (async () => {
    let m = parseFloat(web3.utils.fromWei(nuko.balanceMATIC));
    m = Math.floor(m * Math.pow(10, 4)) / Math.pow(10, 4);
    return m;
  })();

  // do nothing
  if (maticVal > nuko.lowerSwapMaticThreshold) {
    return;
  }
  if (nuko.lowerSwapMaticThreshold == 0 || nuko.swapMaticAmount == 0) {
    return;
  }

  const jpycVal = await (async () => {
    let m = parseFloat(web3.utils.fromWei(nuko.balanceJPYC));
    m = Math.floor(m * Math.pow(10, 2)) / Math.pow(10, 2);
    return m;
  })();
  const usdcVal = await (async () => {
    let m = parseFloat(web3.utils.fromWei(nuko.balanceUSDC, "mwei"));
    m = Math.floor(m * Math.pow(10, 4)) / Math.pow(10, 4);
    return m;
  })();

  if (jpycVal > 1) {
    // JPYC => MATIC
    let jpycPrice = 0;
    let rateReserveMatic = 0;
    let rateReserveJpyc = 0;
    let contract = new web3.eth.Contract(abi, contractAddress.pairMATIC_JPYC);
    await contract.methods
      .getReserves()
      .call()
      .then((values) => {
        // 0..matic 1..jpyc
        jpycPrice =
          Math.floor((values[1] / values[0]) * Math.pow(10, 2)) /
          Math.pow(10, 2);
        jpycPrice = jpycPrice * swapMaticAmount;
        rateReserveMatic = values[0] / 10 ** decimal["MATIC"];
        rateReserveJpyc = values[1] / 10 ** decimal["JPYC"];
      });
    // getRate
    let rateRaw = rateReserveJpyc / rateReserveMatic;
    let rate = Math.floor(rateRaw * Math.pow(10, 2)) / Math.pow(10, 2);
    // watchRate
    let maticJpycMinAmout = (jpycPrice / rate) * (1.0 - nuko.swapSlippage);
    // goSwap
    let amountIn =
      Math.floor(jpycPrice * 10 ** decimal["JPYC"]) / 10 ** decimal["JPYC"];
    amountIn = web3.utils.toWei(amountIn.toString());
    let amountOut =
      Math.floor(maticJpycMinAmout * 10 ** decimal["MATIC"]) /
      10 ** decimal["MATIC"];
    amountOut = web3.utils.toWei(amountOut.toString());

    let gas = nuko.gas < nuko.swapGasMax ? nuko.gas : nuko.swapGasMax;
    const swap = async () => {
      try {
        await nuko.swapContract[0].methods
          .swapExactTokensForETH(
            web3.utils.toHex(amountIn),
            web3.utils.toHex(amountOut),
            [contractAddress["JPYC"], contractAddress["MATIC"]],
            nuko.wallet[0].address,
            Math.floor(Date.now() / 1000) + 60 * 5
          )
          .send({
            from: nuko.wallet[0].address,
            gasLimit: web3.utils.toHex(nuko.gasLimit),
            gasPrice: web3.utils.toHex(gas * 1e9),
          });
      } catch (e) {
        console.error(e);
      }
    };
    await swap();
  } else if (usdcVal > 1) {
    // USDC => MATIC
    let usdcPrice = 0;
    let rateReserveMatic = 0;
    let rateReserveUsdc = 0;
    let contract = new web3.eth.Contract(abi, contractAddress.pairMATIC_USDC);
    await contract.methods
      .getReserves()
      .call()
      .then((values) => {
        // 0..matic 1..usdc
        usdcPrice =
          Math.floor((values[1] / (values[0] / 10 ** 12)) * Math.pow(10, 4)) /
          Math.pow(10, 4);
        usdcPrice = usdcPrice * nuko.swapMaticAmount;
        rateReserveMatic = values[0] / 10 ** decimal["MATIC"];
        rateReserveUsdc = values[1] / 10 ** decimal["USDC"];
      });
    // getRate
    let rateRaw = rateReserveUsdc / rateReserveMatic;
    let rate = Math.floor(rateRaw * Math.pow(10, 4)) / Math.pow(10, 4);
    // watchRate
    let maticUsdcMinAmout = (usdcPrice / rate) * (1.0 - nuko.swapSlippage);
    // goSwap
    let amountIn =
      Math.floor(usdcPrice * 10 ** decimal["USDC"]) / 10 ** decimal["USDC"];
    amountIn = web3.utils.toWei(amountIn.toString(), "mwei");
    let amountOut =
      Math.floor(maticUsdcMinAmout * 10 ** decimal["MATIC"]) /
      10 ** decimal["MATIC"];
    amountOut = web3.utils.toWei(amountOut.toString());

    let gas = nuko.gas < nuko.swapGasMax ? nuko.gas : nuko.swapGasMax;
    const swap = async () => {
      try {
        await nuko.swapContract[0].methods
          .swapExactTokensForETH(
            web3.utils.toHex(amountIn),
            web3.utils.toHex(amountOut),
            [contractAddress["USDC"], contractAddress["MATIC"]],
            nuko.wallet[0].address,
            Math.floor(Date.now() / 1000) + 60 * 5
          )
          .send({
            from: nuko.wallet[0].address,
            gasLimit: web3.utils.toHex(nuko.gasLimit),
            gasPrice: web3.utils.toHex(gas * 1e9),
          });
      } catch (e) {
        console.error(e);
      }
    };
    await swap();
  }
};

/**
 * main function
 */
const main = () => {
  $("#versionText").text("ver. " + VERSION_TEXT);
  $("#versionText2").text("ver. " + VERSION_TEXT);
  initialize();
  nuko.balanceContractJPYC = new web3.eth.Contract(
    abiERC20,
    contractAddress.JPYC
  );
  nuko.balanceContractUSDC = new web3.eth.Contract(
    abiERC20,
    contractAddress.USDC
  );
  nuko.contractRate[0] = new web3.eth.Contract(abi, contractAddress.pairQuick);
  nuko.contractRate[1] = new web3.eth.Contract(abi, contractAddress.pairSushi);
  nuko.swapContract[0] = new web3.eth.Contract(
    abiUniswapV2Router,
    contractAddress.routerQuick
  );
  nuko.swapContract[1] = new web3.eth.Contract(
    abiUniswapV2Router,
    contractAddress.routerSushi
  );

  watchRate().then(
    NukoApi.getCommunityBalance(
      nuko.wallet[0].address,
      nuko,
      updateCommunityBalance
    )
  );
  nuko.rateId = setInterval(watchRate, nuko.rateInterval);

  watchGas();
  nuko.gasId = setInterval(watchGas, nuko.gasInterval);

  watchJPYUSD();
  nuko.jpyusdId = setInterval(watchJPYUSD, nuko.jpyusdInterval);

  nuko.verId = setInterval(checkLatestVersion, nuko.versionInterval);

  NukoApi.getActiveUsers(nuko.wallet[0].address);
  setInterval(() => {
    NukoApi.getActiveUsers(nuko.wallet[0].address);
  }, nuko.keepaliveInterval);

  setInterval(() => {
    NukoApi.getCommunityBalance(
      nuko.wallet[0].address,
      nuko,
      updateCommunityBalance
    );
  }, nuko.keepaliveInterval * 3);

  setInterval(() => {
    if (!web3.currentProvider.connected) {
      nuko.currentWeb3Provider =
        (nuko.currentWeb3Provider + 1) % NODE_URL.length;
      web3.setProvider(NODE_URL[nuko.currentWeb3Provider]);
      console.log("change RPC node to ", NODE_URL[nuko.currentWeb3Provider]);
    }
  }, 15 * 1000);
};

const updateSwapThreshold = () => {};

/**
 * update wallet address
 */
const updateAccount = () => {
  if (nuko.wallet == null) {
    $("#wallet").text("Create or Import Wallet");
  } else {
    $("#wallet").text(nuko.wallet[0].address);
  }
};

const resizeChart = () => {
  let w = $("#containerBody").width() - 400;
  chartJPYCUSDC.resize(w, ctx.clientHeight);
  //  console.log(ctx.clientWidth, ctx.clientHeight);
};

const updateLiquidity = () => {
  $("#quickLiquidity").text(
    "$" +
      (
        nuko.rateReserveUSDC[0] +
        nuko.rateReserveJPYC[0] / nuko.rate[0]
      ).toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })
  );
  $("#quickUSDC").text(
    nuko.rateReserveUSDC[0].toLocaleString(undefined, {
      maximumFractionDigits: 0,
    }) + " USDC"
  );
  $("#quickJPYC").text(
    nuko.rateReserveJPYC[0].toLocaleString(undefined, {
      maximumFractionDigits: 0,
    }) + " JPYC"
  );

  $("#sushiLiquidity").text(
    "$" +
      (
        nuko.rateReserveUSDC[1] +
        nuko.rateReserveJPYC[1] / nuko.rate[1]
      ).toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })
  );
  $("#sushiUSDC").text(
    nuko.rateReserveUSDC[1].toLocaleString(undefined, {
      maximumFractionDigits: 0,
    }) + " USDC"
  );
  $("#sushiJPYC").text(
    nuko.rateReserveJPYC[1].toLocaleString(undefined, {
      maximumFractionDigits: 0,
    }) + " JPYC"
  );
};

/**
 * check if latest version is available. then reload.
 */
const checkLatestVersion = () => {
  fetch("https://nuko973663.github.io/JPYCstabilizer/version.json").then(
    (res) => {
      if (res.ok) {
        res.json().then((j) => {
          console.log(
            "latest version: ",
            j.version,
            " current version: ",
            VERSION_TEXT
          );

          if (parseFloat(j.version) > parseFloat(VERSION_TEXT)) {
            if (!nuko.versionAlertFlag) {
              let message = `New version ${j.version} available!`;
              showAlert(message);
              nuko.versionAlertFlag = true;
            }
            if (nuko.reloadAvailableUpdates) window.location.reload(true);
          }
        });
      }
    }
  );
};

/**
 * Show alert message
 * @param {string} message
 */
const showAlert = (message) => {
  let txt = `  <div class="alert alert-warning alert-dismissible fade show" role="alert">
    ${message}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>`;
  $("#alert").append(txt);
};

const initialize = () => {
  if (localStorage.gasPref == undefined) {
    localStorage.gasPref = "fastest";
  }
  nuko.gasPref = localStorage.gasPref;

  if (localStorage.lowerSwapMaticThreshold == undefined) {
    localStorage.lowerSwapMaticThreshold = "0";
  }
  nuko.lowerSwapMaticThreshold = parseFloat(
    localStorage.lowerSwapMaticThreshold
  );

  if (localStorage.swapMaticAmount == undefined) {
    localStorage.swapMaticAmount = "0";
  }
  nuko.swapMaticAmount = parseFloat(localStorage.swapMaticAmount);

  try {
    web3.eth.accounts.wallet.load(nuko.password);
    nuko.wallet = web3.eth.accounts.wallet;
    updateAccount();
  } catch (e) {}

  $("#createWallet").on("click", () => {
    $("#import").hide();
    $("#createNewWallet").show();
    $("#privateKey").prop("readonly", true);
    $("#modalTitle").text("Create New Wallet");
    $("#exampleModal").modal("show");
  });
  $("#importWallet").on("click", () => {
    $("#import").show();
    $("#createNewWallet").hide();
    $("#modalTitle").text("Import Wallet");
    $("#privateKey").prop("readonly", false);
    $("#exampleModal").modal("show");
  });

  $("#lowerSwapMaticThreshold").val(nuko.lowerSwapMaticThreshold);
  $("#swapMaticAmount").val(nuko.swapMaticAmount);

  $("#approveJPYC0").on("click", () => {
    $("#approveJPYC0").addClass("disabled");
    approveCoin(
      contractAddress.JPYC,
      contractAddress.routerQuick,
      "#approveJPYCtext0"
    );
  });
  $("#approveUSDC0").on("click", () => {
    $("#approveUSDC0").addClass("disabled");
    approveCoin(
      contractAddress.USDC,
      contractAddress.routerQuick,
      "#approveUSDCtext0"
    );
  });
  $("#approveJPYC1").on("click", () => {
    $("#approveJPYC1").addClass("disabled");
    approveCoin(
      contractAddress.JPYC,
      contractAddress.routerSushi,
      "#approveJPYCtext1"
    );
  });
  $("#approveUSDC1").on("click", () => {
    $("#approveUSDC1").addClass("disabled");
    approveCoin(
      contractAddress.USDC,
      contractAddress.routerSushi,
      "#approveUSDCtext1"
    );
  });

  /*
  $(document).on("input", "#spreadWidth", function () {
    nuko.spread = parseFloat($(this).val());
    localStorage.spread = nuko.spread;
    $("#spread").text(nuko.spread.toFixed(1));
    updateLimit();
  });
  */

  $("#createNewWallet").on("click", () => {
    web3.eth.accounts.wallet.clear();
    nuko.wallet = web3.eth.accounts.wallet.create(1);
    web3.eth.accounts.wallet.save(nuko.password);
    $("#address").val(nuko.wallet[0].address);
    $("#privateKey").val(nuko.wallet[0].privateKey);
    updateAccount();
  });
  $("#logout").on("click", () => {
    web3.eth.accounts.wallet.clear();
    web3.eth.accounts.wallet.save(nuko.password);
    $("#address").val("");
    $("#privateKey").val("");
    nuko.wallet = null;
    updateAccount();
    $("#logoutModal").modal("hide");
  });
  $("#import").on("click", () => {
    console.log("import");
    try {
      let account = web3.eth.accounts.privateKeyToAccount(
        $("#privateKey").val()
      );
      web3.eth.accounts.wallet.clear();
      web3.eth.accounts.wallet.add(account);
      nuko.wallet = web3.eth.accounts.wallet;
      web3.eth.accounts.wallet.save(nuko.password);
      $("#address").val(nuko.wallet[0].address);
      $("#privateKey").val(nuko.wallet[0].privateKey);
      updateAccount();
    } catch (e) {
      console.log(e);
    }
  });
  $("#swapSwitch").on("change", () => {
    localStorage.switch = $("#swapSwitch").prop("checked");
  });
  $("#gasFastest").on("click", () => {
    nuko.gasPref = "fastest";
    localStorage.gasPref = nuko.gasPref;
    watchGas();
  });
  $("#gasFaster").on("click", () => {
    nuko.gasPref = "faster";
    localStorage.gasPref = nuko.gasPref;
    watchGas();
  });
  $("#gasFast").on("click", () => {
    nuko.gasPref = "fast";
    localStorage.gasPref = nuko.gasPref;
    watchGas();
  });
  $("#gasStandard").on("click", () => {
    nuko.gasPref = "standard";
    localStorage.gasPref = nuko.gasPref;
    watchGas();
  });
  $("#submitAutoSwap").on("click", () => {
    let lowerSwapMaticThreshold = $("#lowerSwapMaticThreshold").val();
    let swapMaticAmount = $("#swapMaticAmount").val();
    localStorage.lowerSwapMaticThreshold = lowerSwapMaticThreshold
      ? lowerSwapMaticThreshold
      : "0";
    localStorage.swapMaticAmount = swapMaticAmount ? swapMaticAmount : "0";
    nuko.lowerSwapMaticThreshold = parseFloat(
      localStorage.lowerSwapMaticThreshold
    );
    nuko.swapMaticAmount = parseFloat(localStorage.swapMaticAmount);
    $("#modalAutoswapMatic").modal("hide");
  });

  updateLimit();

  if (localStorage.switch == undefined) {
    localStorage.switch = "false";
  }
  if (localStorage.switch == "true") {
    $("#swapSwitch").bootstrapToggle("on");
  }

  nuko.swapLog = JSON.parse(localStorage.getItem("swapLog") || "[]");

  let table = $("#dataTable").DataTable();
  nuko.swapLog.forEach((log) => {
    table.row.add(log);
  });
  table.column("0:visible").order("dsc").draw();

  updateAllowance();

  /*
  nuko.spread = parseFloat(localStorage.spread ? localStorage.spread : 2);
  $("#spreadWidth").val(nuko.spread);
  $("#spread").text(nuko.spread.toFixed(1));
  */
  nuko.upperThreshold = parseFloat(
    localStorage.upperThreshold ? localStorage.upperThreshold : 117.7
  );
  nuko.lowerThreshold = parseFloat(
    localStorage.lowerThreshold ? localStorage.lowerThreshold : 115.7
  );
  $("#swapUpperThreshold").val(nuko.upperThreshold.toFixed(2));
  $("#swapLowerThreshold").val(nuko.lowerThreshold.toFixed(2));

  $("#submitOption").on("click", () => {
    nuko.upperThreshold = parseFloat($("#swapUpperThreshold").val());
    nuko.lowerThreshold = parseFloat($("#swapLowerThreshold").val());
    localStorage.upperThreshold = nuko.upperThreshold;
    localStorage.lowerThreshold = nuko.lowerThreshold;
    $("#modalOption").modal("hide");
    console.log(nuko);
    updateLimit();
  });

  /**
   * minimum amount of swaping
   */
  {
    nuko.swapMinJPYC = parseFloat(
      localStorage.swapMinJPYC ? localStorage.swapMinJPYC : 1000.0
    );
    nuko.swapMinUSDC = parseFloat(
      localStorage.swapMinUSDC ? localStorage.swapMinUSDC : 10.0
    );
    $("#swapMinJPYC").val(nuko.swapMinJPYC);
    $("#swapMinUSDC").val(nuko.swapMinUSDC);
    $("#swapMinJPYC").on("change", () => {
      nuko.swapMinJPYC = parseFloat($("#swapMinJPYC").val());
      localStorage.swapMinJPYC = nuko.swapMinJPYC;
      console.log(nuko.swapMinJPYC);
    });
    $("#swapMinUSDC").on("change", () => {
      nuko.swapMinUSDC = parseFloat($("#swapMinUSDC").val());
      localStorage.swapMinUSDC = nuko.swapMinUSDC;
      console.log(nuko.swapMinUSDC);
    });
  }

  /** reload if updates */
  {
    nuko.reloadAvailableUpdates = localStorage.reloadAvailableUpdates
      ? localStorage.reloadAvailableUpdates == "true"
      : false;
    $("#reloadAvailableUpdate").prop("checked", nuko.reloadAvailableUpdates);
    $("#reloadAvailableUpdate").on("change", () => {
      nuko.reloadAvailableUpdates = $("#reloadAvailableUpdate").prop("checked");
      localStorage.reloadAvailableUpdates = nuko.reloadAvailableUpdates;
    });
  }
};

// getReserves関数のABI
const abi = [
  {
    constant: true,
    inputs: [],
    name: "getReserves",
    outputs: [
      { internalType: "uint112", name: "_reserve0", type: "uint112" },
      { internalType: "uint112", name: "_reserve1", type: "uint112" },
      { internalType: "uint32", name: "_blockTimestampLast", type: "uint32" },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

// The minimum ABI to get ERC20 Token balance
const abiERC20 = [
  // balanceOf
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  // decimals
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "spender", type: "address" },
      { name: "tokens", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "success", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "_owner",
        type: "address",
      },
      {
        name: "_spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

const abiUniswapV2Router = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amountIn",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amountOutMin",
        type: "uint256",
      },
      {
        internalType: "address[]",
        name: "path",
        type: "address[]",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
    ],
    name: "swapExactTokensForTokens",
    outputs: [
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amountIn",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amountOutMin",
        type: "uint256",
      },
      {
        internalType: "address[]",
        name: "path",
        type: "address[]",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
    ],
    name: "swapExactTokensForETH",
    outputs: [
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

main();

$(document).ready(() => {
  $("#dataTable").DataTable();
});

// Set new default font family and font color to mimic Bootstrap's default styling
(Chart.defaults.global.defaultFontFamily = "Nunito"),
  '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = "#858796";

function number_format(number, decimals, dec_point, thousands_sep) {
  number = (number + "").replace(",", "").replace(" ", "");
  var n = !isFinite(+number) ? 0 : +number,
    prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
    sep = typeof thousands_sep === "undefined" ? "," : thousands_sep,
    dec = typeof dec_point === "undefined" ? "." : dec_point,
    s = "",
    toFixedFix = function (n, prec) {
      var k = Math.pow(10, prec);
      return "" + Math.round(n * k) / k;
    };
  // Fix for IE parseFloat(0.55).toFixed(0) = 0;
  s = (prec ? toFixedFix(n, prec) : "" + Math.round(n)).split(".");
  if (s[0].length > 3) {
    s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
  }
  if ((s[1] || "").length < prec) {
    s[1] = s[1] || "";
    s[1] += new Array(prec - s[1].length + 1).join("0");
  }
  return s.join(dec);
}

// Area Chart Example
var ctx = document.getElementById("myAreaChart");
var chartJPYCUSDC = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "QuickSwap",
        lineTension: 0.3,
        backgroundColor: "rgba(78, 115, 223, 0.05)",
        borderColor: "rgba(78, 115, 223, 1)",
        pointRadius: 3,
        pointBackgroundColor: "rgba(78, 115, 223, 1)",
        pointBorderColor: "rgba(78, 115, 223, 1)",
        pointHoverRadius: 3,
        pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
        pointHoverBorderColor: "rgba(78, 115, 223, 1)",
        pointHitRadius: 10,
        pointBorderWidth: 2,
        data: [],
      },
      {
        label: "SushiSwap",
        lineTension: 0.3,
        backgroundColor: "rgba(204, 0, 255, 0.05)",
        borderColor: "rgba(204, 0, 255, 1)",
        pointRadius: 3,
        pointBackgroundColor: "rgba(204, 0, 255, 1)",
        pointBorderColor: "rgba(204, 0, 255, 1)",
        pointHoverRadius: 3,
        pointHoverBackgroundColor: "rgba(204, 0, 255, 1)",
        pointHoverBorderColor: "rgba(204, 0, 255, 1)",
        pointHitRadius: 10,
        pointBorderWidth: 2,
        data: [],
      },
    ],
  },
  options: {
    onResize: resizeChart,
    resizeDelay: 100,
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 10,
        right: 25,
        top: 25,
        bottom: 0,
      },
    },
    scales: {
      xAxes: [
        {
          time: {
            unit: "date",
          },
          gridLines: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            maxTicksLimit: 7,
          },
        },
      ],
      yAxes: [
        {
          ticks: {
            maxTicksLimit: 5,
            padding: 10,
            // Include a dollar sign in the ticks
            callback: function (value, index, values) {
              return number_format(value, 2) + "";
            },
          },
          gridLines: {
            color: "rgb(234, 236, 244)",
            zeroLineColor: "rgb(234, 236, 244)",
            drawBorder: false,
            borderDash: [2],
            zeroLineBorderDash: [2],
          },
        },
      ],
    },
    legend: {
      display: true,
    },
    tooltips: {
      backgroundColor: "rgb(255,255,255)",
      bodyFontColor: "#858796",
      titleMarginBottom: 10,
      titleFontColor: "#6e707e",
      titleFontSize: 14,
      borderColor: "#dddfeb",
      borderWidth: 1,
      xPadding: 15,
      yPadding: 15,
      displayColors: false,
      intersect: false,
      mode: "index",
      caretPadding: 10,
      callbacks: {
        label: function (tooltipItem, chart) {
          var datasetLabel =
            chart.datasets[tooltipItem.datasetIndex].label || "";
          return datasetLabel + ": " + number_format(tooltipItem.yLabel, 2);
        },
      },
    },
  },
});

// Community Balance Pie Chart
var ctx = document.getElementById("myPieChart");
var chartCommunityBalance = new Chart(ctx, {
  type: "doughnut",
  data: {
    labels: ["USDC", "JPYC"],
    datasets: [
      {
        data: [55, 30],
        backgroundColor: ["#1cc88a", "#4e73df"],
        hoverBackgroundColor: ["#17a673", "#2e59d9"],
        hoverBorderColor: "rgba(234, 236, 244, 1)",
      },
    ],
  },
  options: {
    maintainAspectRatio: false,
    tooltips: {
      backgroundColor: "rgb(255,255,255)",
      bodyFontColor: "#858796",
      borderColor: "#dddfeb",
      borderWidth: 1,
      xPadding: 15,
      yPadding: 15,
      displayColors: false,
      caretPadding: 10,
    },
    legend: {
      display: false,
    },
    cutoutPercentage: 80,
  },
});
