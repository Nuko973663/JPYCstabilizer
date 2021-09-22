/**
 * fixedTarget.js
 */
"use strict";

export class FixedTarget {
  constructor(targetRate, spread) {
    this.targetRate = targetRate;
    this.spread = spread;
    this.upperThreshold = targetRate + spread / 2;
    this.lowerThreshold = targetRate - spread / 2;
  }

  get upperThreshold() {
    return this.upperThreshold;
  }
  set upperThreshold(val) {
    //this.upperThreshold = val;
    this.spread = this.upperThreshold - this.lowerThreshold;
  }
  /*
  get lowerThreshold() {
    return this.lowerThreshold;
  }
  set lowerThreshold(val) {
    this.lowerThreshold = val;
    this.spread = this.upperThreshold - this.lowerThreshold;
  }

  get spread() {
    return this.spread;
  }
  set spread(val) {
    this.spread = val;
    this.upperThreshold = targetRate + spread / 2;
    this.lowerThreshold = targetRate - spread / 2;
  }

  get targetRate() {
    return this.targetRate;
  }
  set targetRate(val) {
    this.targetRate = val;
    this.upperThreshold = targetRate + spread / 2;
    this.lowerThreshold = targetRate - spread / 2;
  }
*/
}
