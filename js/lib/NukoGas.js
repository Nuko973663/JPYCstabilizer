/**
 * NukoGas.js
 */
"use strict";

const URL_GASSTAION = "https://gasstation-mainnet.matic.network";

/**
 * NukoApi
 */
export class NukoGas {
  option = {
    price: 0,
    list: null,
    pref: "fastest",
    interval: 15000,
    limit: 300000,
    labels: ["fastest", "faster", "fast", "standard", "safeLow"],
  };

  /**
   *
   * @returns latest gas price
   */
  async getGas() {
    let response = await fetch(URL_GASSTAION);
    let json = await response.json();
    this.option.list = json;
    this.option.list.faster =
      (parseInt(this.option.list.fastest) + parseInt(this.option.list.fast)) /
      2;
    this.option.price = parseInt(json[this.option.pref]);
    return this.option.price;
  }

  set limit(limit) {
    this.option.limit = limit;
  }

  get list() {
    return this.option.list;
  }

  get price() {
    return this.option.price;
  }

  get pref() {
    return this.option.pref;
  }

  set pref(pref) {
    this.option.pref = pref;
  }

  get interval() {
    return this.option.interval;
  }

  get labels() {
    return this.option.labels;
  }

  get limit() {
    return this.option.limit;
  }
}
