/**
 * jpyc stabilizer
 * index.js
 */

"use strict";

import { NukoApi } from "./lib/NukoApi.min.js";

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
 * watch rate
 */
const watchRate = async () => {
  await getRate();
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
};

const watchGas = async () => {
  nuko.gas = await getGas();
  $("#gasPrice").text(nuko.gas + " " + nuko.gasPref);
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
};

/**
 * main function
 */
const main = () => {
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

  watchRate();
  nuko.rateId = setInterval(watchRate, nuko.rateInterval);

  watchGas();
  nuko.gasId = setInterval(watchGas, nuko.gasInterval);

  watchJPYUSD();
  nuko.jpyusdId = setInterval(watchJPYUSD, nuko.jpyusdInterval);

  NukoApi.getActiveUsers("");
  setInterval(() => {
    NukoApi.getActiveUsers("");
  }, nuko.keepaliveInterval);

  setInterval(() => {
    if (!web3.currentProvider.connected) {
      nuko.currentWeb3Provider =
        (nuko.currentWeb3Provider + 1) % NODE_URL.length;
      web3.setProvider(NODE_URL[nuko.currentWeb3Provider]);
      console.log("change RPC node to ", NODE_URL[nuko.currentWeb3Provider]);
    }
  }, 15 * 1000);
};

const initialize = () => {
  if (localStorage.gasPref == undefined) {
    localStorage.gasPref = "fastest";
  }
  nuko.gasPref = localStorage.gasPref;

  $(document).on("input", "#swapUpperThreshold", updateFig);
  $(document).on("input", "#swapLowerThreshold", updateFig);

  /* Please do NOT call API frequently. Resource of API server is running out. */
  NukoApi.getSMA(3600 * 24 * 7).then((sma) => {
    $("#swapUpperThreshold").val(sma + 1);
    $("#swapLowerThreshold").val(sma - 1);
    NukoApi.getRateLog().then((data) => {
      let log = data.reduce(
        (acc, cur) => {
          acc.date.push(new Date(cur.date).toLocaleString().slice(0, -3));
          acc.rate.push(cur.rate);
          return acc;
        },
        { date: [], rate: [] }
      );
      let chart = chartJPYCUSDC;
      chart.data.labels = log.date;
      chart.data.datasets[0].data = log.rate;

      updateFig();
    });
  });
};

const updateFig = () => {
  let chart = chartJPYCUSDC;
  let dt = chart.data.datasets[0].data;

  let upper = [...dt];
  let lower = [...dt];
  let ul = parseFloat($("#swapUpperThreshold").val());
  let ll = parseFloat($("#swapLowerThreshold").val());

  chart.data.datasets[1].data = upper.fill(ul);
  chart.data.datasets[2].data = lower.fill(ll);
  chart.update();

  let countUpper = dt.filter((n) => n > ul).length;
  let countLower = dt.filter((n) => n < ll).length;
  $("#numUpper").text(countUpper);
  $("#numLower").text(countLower);
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

main();

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
        lineTension: 0.2,
        backgroundColor: "rgba(78, 115, 223, 0.0)",
        borderColor: "rgba(78, 115, 223, 1)",
        pointRadius: 1,
        pointBackgroundColor: "rgba(78, 115, 223, 1)",
        pointBorderColor: "rgba(78, 115, 223, 1)",
        pointHoverRadius: 3,
        pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
        pointHoverBorderColor: "rgba(78, 115, 223, 1)",
        pointHitRadius: 10,
        pointBorderWidth: 1,
        data: [],
      },
      {
        label: "upper",
        lineTension: 0.1,
        backgroundColor: "rgba(204, 0, 255, 0)",
        borderColor: "rgba(204, 0, 255, 1)",
        pointRadius: 0,
        pointHoverRadius: 0,
        pointHitRadius: 0,
        pointBorderWidth: 0,
        data: [],
      },
      {
        label: "lower",
        lineTension: 0.1,
        backgroundColor: "rgba(204, 0, 255, 0.0)",
        borderColor: "rgba(255, 128, 128, 1)",
        pointRadius: 0,
        pointHoverRadius: 0,
        pointHitRadius: 0,
        pointBorderWidth: 0,
        data: [],
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
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
