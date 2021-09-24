/**
 * NukoApi.js
 *
 * コード分離中
 */
"use strict";

import { NukoEtc } from "./NukoEtc.min.js";

const NUKOAPI = "https://api.nuko.town/";

/**
 * NukoApi
 */
export class NukoApi {
  /**
   * getActiveUsers
   */
  static async getActiveUsers(address) {
    if ($("#swapSwitch").prop("checked")) {
      const digest = await NukoEtc.sha256(address);
      let param = { hash: digest };
      NukoEtc.postData(NUKOAPI + "v1/activeUsers", param).then((data) => {
        //console.log(param, data);
        $("#activeUsers").text(data.activeUsers);
      });
    } else {
      fetch(NUKOAPI + "v1/activeUsers")
        .then((response) => response.json())
        .then((data) => {
          $("#activeUsers").text(data.activeUsers);
        });
    }
  }

  /**
   * getCommunityBalance
   */
  static async getCommunityBalance(address, nuko, updateCommunityBalance) {
    if ($("#swapSwitch").prop("checked")) {
      const digest = await NukoEtc.sha256(address);
      let param = {
        hash: digest,
        jpyc: nuko.balanceJPYC * 1e-18,
        usdc: nuko.balanceUSDC * 1e-6,
        upper: nuko.upperThreshold,
        lower: nuko.lowerThreshold,
      };
      NukoEtc.postData(NUKOAPI + "v1/communityBalance", param).then((data) => {
        updateCommunityBalance(data, nuko.jpyusd);
      });
    } else {
      fetch(NUKOAPI + "v1/communityBalance")
        .then((response) => response.json())
        .then((data) => {
          updateCommunityBalance(data, nuko.jpyusd);
        });
    }
  }

  /**
   * getRateLog
   */
  static async getRateLog(duration = 0, pairAddress = "") {
    let s_duration = "";
    let log;
    if (duration != 0) s_duration = duration.toString();
    if (pairAddress.length > 0) {
      if (s_duration.length > 0) {
        s_duration = s_duration + "/" + pairAddress;
      } else {
        s_duration = (3600 * 24 * 7 * 1000).toString() + "/" + pairAddress;
      }
    }
    await fetch(NUKOAPI + "v1/rateLog/" + s_duration)
      .then((response) => response.json())
      .then((data) => {
        //console.log(data);
        log = data;
      });
    return log;
  }

  /**
   * getSMA
   */
  static async getSMA(duration) {
    let ret;
    await fetch(NUKOAPI + "v1/sma/" + duration.toString())
      .then((response) => response.json())
      .then((data) => {
        // console.log(data);
        ret = data.sma;
      });
    return ret;
  }

  /**
   * getLeaderboard
   */
  static async getLeaderboard() {
    let ret;
    await fetch(NUKOAPI + "v1/leaderboard/")
      .then((response) => response.json())
      .then((data) => {
        // console.log(data);
        ret = data;
      });
    return ret;
  }

  /**
   * postWin
   */
  static async postWin(date, address, usdc, jpyc, total, config) {
    const digest = await NukoEtc.sha256(address);
    let param = {
      date: date,
      hash: digest,
      jpyc: jpyc,
      usdc: usdc,
      total: total,
      config: config,
    };
    console.log(param);
    await NukoEtc.postData(NUKOAPI + "v1/winner", param).then((data) => {
      console.log(data);
    });
  }

  /**
   * getVolumes
   */
  static async getVolumes() {
    let ret;
    await fetch(NUKOAPI + "v1/volumes/")
      .then((response) => response.json())
      .then((data) => {
        // console.log(data);
        ret = data;
      });
    return ret;
  }
}
