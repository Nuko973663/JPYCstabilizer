/**
 * jpyc stabilizer
 * index.js
 */

"use strict";

const VERSION_TEXT = "ver. 20210914.0";

var nuko = {
  gas: 0,
  gasList: null,
  gasPref: "fastest",
  gasId: 0,
  gasInterval: 15000,
  gasLimit: 300000,
  rate: 0,
  rateRaw: 0,
  rateId: 0,
  rateInterval: 30000, // RPC nodeに負荷をかけるので短くするのはお控えください Please do not shorten rateInterval. It causes high load of RPC node.
  rateContract: null,
  rateReserveUSDC: 0,
  rateReserveJPYC: 0,
  balanceJPYC: 0,
  balanceUSDC: 0,
  balanceMATIC: 0,
  balanceContractJPYC: null,
  balanceContractUSDC: null,
  swapContract: null,
  swapMaxJPYC: 10000,
  swapMaxUSDC: 100,
  swapSlippage: 0.006,
  swapGasMax: 300,
  swapLog: [],
  swapMaxLog: 100,
  upperThreshold: 117.9,
  lowerThreshold: 115.9,
  jpyusd: 100,
  jpyusdInterval: 300 * 1000, // 5 min
  jpyusdId: 0,
  flgSwapping: 0,
  wallet: null,
  password: "c04Bef8613730faC95166A970300caC35b1Af883",
  theDayOfTrueStable: "2021-10-10T10:10:10.000Z",
  theDayOfNuko: "2021-09-14T00:02:00.000Z",
  theDayOfNukoRateDeviate: 117.0 / 110.0,
};

const NODE_URL =
  "wss://speedy-nodes-nyc.moralis.io/3e336936ccd6ec0af99dc191/polygon/mainnet/ws";

const contractAddress = {
  JPYC: "0x6ae7dfc73e0dde2aa99ac063dcf7e8a63265108c",
  USDC: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
  routerQuick: "0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff",
  pairQuick: "0x205995421C72Dc223F36BbFad78B66EEa72d2677",
  routerSushi: "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506",
  pairSushi: "0xfbae8e2d04a67c10047d83ee9b8aeffe7f6ea3f4",
};

const decimal = {
  JPYC: 18,
  USDC: 6,
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

const provider = new Web3.providers.WebsocketProvider(NODE_URL, options);
const web3 = new Web3(provider);

/**
 * goSwap
 */
const goSwap = async (from, to, amount, minAmount, gas) => {
  let table = $("#dataTable").DataTable();
  let timestamp = new Date();
  let dt = timestamp.toLocaleString();
  let row = table.row.add([
    dt,
    from,
    to,
    nuko.rate,
    amount,
    minAmount,
    gas,
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

  try {
    await nuko.swapContract.methods
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
          .data([dt, from, to, nuko.rate, amount, minAmount, gas, link])
          .draw();
        table.column("0:visible").order("dsc").draw();
      })
      .once("receipt", (receipt) => {
        console.log(receipt);
        let gasUsed = (receipt.gasUsed * gas * 1e9 * 1e-18).toFixed(4);
        link = link + '<i class="fas fa-check-circle"></i>';
        let log = [dt, from, to, nuko.rate, amount, minAmount, gasUsed, link];
        row.data(log).draw();
        table.column("0:visible").order("dsc").draw();
        if (nuko.swapLog.unshift(log) > nuko.swapMaxLog) {
          nuko.swapLog.pop();
        }
        localStorage.swapLog = JSON.stringify(nuko.swapLog);
      });
  } catch (e) {
    link = link + '<i class="fas fa-exclamation-triangle"></i>';
    row.data([dt, from, to, nuko.rate, amount, minAmount, gas, link]).draw();
    table.column("0:visible").order("dsc").draw();
    console.log(e);
  }
  nuko.flgSwapping = false;
  getBalance();
};

/**
 * watch
 */
const watchRate = async () => {
  await getBalance();
  await getRate();

  if ($("#swapSwitch").prop("checked")) {
    console.log(nuko.rate);
    if (
      nuko.rate > nuko.upperThreshold &&
      parseFloat(web3.utils.fromWei(nuko.balanceUSDC, "mwei")) > 1
    ) {
      if (!nuko.flgSwapping) {
        nuko.flgSwapping = true;
        console.log("USDC->JPYC");
        let bl =
          parseFloat(web3.utils.fromWei(nuko.balanceUSDC, "mwei")) * 0.99999;
        let amount = bl > nuko.swapMaxUSDC ? nuko.swapMaxUSDC : bl;
        let minAmount = amount * nuko.rate * (1.0 - nuko.swapSlippage);
        goSwap(
          "USDC",
          "JPYC",
          amount,
          minAmount,
          nuko.gas < nuko.swapGasMax ? nuko.gas : nuko.swapGasMax
        );
      }
    } else if (
      nuko.rate < nuko.lowerThreshold &&
      parseFloat(web3.utils.fromWei(nuko.balanceJPYC)) > 100
    ) {
      if (!nuko.flgSwapping) {
        nuko.flgSwapping = true;
        console.log("JPYC -> USDC");
        let bl = parseFloat(web3.utils.fromWei(nuko.balanceJPYC)) * 0.99999;
        let amount = bl > nuko.swapMaxJPYC ? nuko.swapMaxJPYC : bl;
        let minAmount = (amount / nuko.rate) * (1.0 - nuko.swapSlippage);
        goSwap(
          "JPYC",
          "USDC",
          amount,
          minAmount,
          nuko.gas < nuko.swapGasMax ? nuko.gas : nuko.swapGasMax
        );
      }
    }
  }
};

const getRate = async () => {
  await nuko.contractRate.methods
    .getReserves()
    .call()
    .then((values) => {
      nuko.rateReserveUSDC = values[0] / 10 ** 6;
      nuko.rateReserveJPYC = values[1] / 10 ** 18;
      nuko.rateRaw = nuko.rateReserveJPYC / nuko.rateReserveUSDC;
      nuko.rate = Math.floor(nuko.rateRaw * Math.pow(10, 2)) / Math.pow(10, 2);
      $("#rate").text(nuko.rate + " JPYC");
    });
  let timestamp = new Date();
  let dt = timestamp.toLocaleString().slice(0, -3);
  chartAddData(dt, [nuko.rate, nuko.rate]);
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
    $("#balanceMATIC").text(m);
  });

  nuko.balanceContractJPYC.methods
    .balanceOf(nuko.wallet[0].address)
    .call()
    .then((balance) => {
      nuko.balanceJPYC = balance;
      let m = parseFloat(web3.utils.fromWei(balance));
      m = Math.floor(m * Math.pow(10, 2)) / Math.pow(10, 2);
      $("#balanceJPYC").text(m);
    });
  nuko.balanceContractUSDC.methods
    .balanceOf(nuko.wallet[0].address)
    .call()
    .then((balance) => {
      nuko.balanceUSDC = balance;
      let m = parseFloat(web3.utils.fromWei(balance, "mwei"));
      m = Math.floor(m * Math.pow(10, 4)) / Math.pow(10, 4);
      $("#balanceUSDC").text(m);
      return balance;
    });
};

const watchGas = async () => {
  nuko.gas = await getGas();
  $("#gasPrice").text(nuko.gas + " gwei");
  $("#gasFastest").text(
    "fastest : " + parseInt(nuko.gasList.fastest) + " gwei"
  );
  $("#gasFast").text("fast : " + parseInt(nuko.gasList.fast) + " gwei");
  $("#gasStandard").text(
    "standard : " + parseInt(nuko.gasList.standard) + " gwei"
  );
};

const getGas = async () => {
  let response = await fetch("https://gasstation-mainnet.matic.network");
  let json = await response.json();
  nuko.gasList = json;
  let gas = parseInt(json[nuko.gasPref]);
  return gas;
};

const getJPYUSD = async () => {
  let response = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=jpy%2Cusd"
  );
  let json = await response.json();
  let jpyusd = parseInt(json.bitcoin.jpy) / parseInt(json.bitcoin.usd);

  let deviateTorelance =
    Math.max(0, Date.parse(nuko.theDayOfTrueStable) - Date.now()) /
    (Date.parse(nuko.theDayOfTrueStable) - Date.parse(nuko.theDayOfNuko));

  let targetRate =
    (1 + deviateTorelance * (nuko.theDayOfNukoRateDeviate - 1)) * jpyusd;

  nuko.upperThreshold = targetRate + 1.0;
  nuko.lowerThreshold = targetRate - 1.0;

  return jpyusd;
};

const watchJPYUSD = async () => {
  nuko.jpyusd = await getJPYUSD();
  $("#jpyusd").text(nuko.jpyusd.toFixed(2));
  updateLimit();
};

const approveCoin = async (tokenContractAddress, id) => {
  console.log("try approving " + tokenContractAddress);

  let tokenContract = new web3.eth.Contract(abiERC20, tokenContractAddress);

  let tokenDecimals = web3.utils.toBN(18);
  let tokenAmountToApprove = web3.utils.toBN(999000000000);
  let calculatedApproveValue = web3.utils.toHex(
    tokenAmountToApprove.mul(web3.utils.toBN(10).pow(tokenDecimals))
  );

  await tokenContract.methods
    .approve(contractAddress.routerQuick, calculatedApproveValue)
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
  $("#upperLimit").text(nuko.upperThreshold.toFixed(2));
  $("#lowerLimit").text(nuko.lowerThreshold.toFixed(2));
};

/**
 * main
 */
const main = () => {
  $("#versionText").text(VERSION_TEXT);
  initialize();
  nuko.balanceContractJPYC = new web3.eth.Contract(
    abiERC20,
    contractAddress.JPYC
  );
  nuko.balanceContractUSDC = new web3.eth.Contract(
    abiERC20,
    contractAddress.USDC
  );
  nuko.contractRate = new web3.eth.Contract(abi, contractAddress.pairQuick);
  nuko.swapContract = new web3.eth.Contract(
    abiUniswapV2Router,
    contractAddress.routerQuick
  );

  watchRate();
  nuko.rateId = setInterval(watchRate, nuko.rateInterval);

  watchGas();
  nuko.gasId = setInterval(watchGas, nuko.gasInterval);

  watchJPYUSD();
  nuko.jpyusdId = setInterval(watchJPYUSD, nuko.jpyusdInterval);
};

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

const initialize = () => {
  if (localStorage.gasPref == undefined) {
    localStorage.gasPref = "fastest";
  }
  nuko.gasPref = localStorage.gasPref;

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

  $("#approveCoins").on("click", () => {
    $("#modalApprove").modal("show");
  });
  $("#approveJPYC").on("click", () => {
    $("#approveJPYC").addClass("disabled");
    approveCoin(contractAddress.JPYC, "#approveJPYCtext");
  });
  $("#approveUSDC").on("click", () => {
    $("#approveUSDC").addClass("disabled");
    approveCoin(contractAddress.USDC, "#approveUSDCtext");
  });

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
  // *     example: number_format(1234.56, 2, ',', ' ');
  // *     return: '1 234,56'
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
