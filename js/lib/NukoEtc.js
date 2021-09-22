/**
 * NukoEtc.js
 */
"use strict";

/**
 * NukoEtc
 */
export class NukoEtc {
  /**
   * calculate SHA-256
   * @param {*} str
   * @returns
   */
  static async sha256(str) {
    const buff = new Uint8Array([].map.call(str, (c) => c.charCodeAt(0)))
      .buffer;
    const digest = await crypto.subtle.digest("SHA-256", buff);
    return [].map
      .call(new Uint8Array(digest), (x) => ("00" + x.toString(16)).slice(-2))
      .join("");
  }

  /**
   * REST API: POST
   * @param {*} url
   * @param {*} data
   * @returns
   */
  static async postData(url = "", data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
      method: "POST",
      //mode: "cors",
      cache: "no-cache",
      //credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
      body: JSON.stringify(data),
    });
    return response.json(); // parses JSON response into native JavaScript objects
  }
}
