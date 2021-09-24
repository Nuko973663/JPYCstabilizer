/**
 * Nuko.js
 *
 * コード分離中
 */
"use strict";

import { NukoApi } from "./NukoApi.min.js";
import { NukoGas } from "./NukoGas.min.js";
import { NukoEtc } from "./NukoEtc.min.js";

//const NUKOAPI = "https://api.nuko.town/";

/**
 * Nuko
 */
export class Nuko {
  static API = NukoApi;
  static ETC = NukoEtc;
  gas;
  constructor() {
    this.gas = new NukoGas();
  }
}
