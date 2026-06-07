import { Injectable } from '@nestjs/common';

interface IpData {
  reqTimestamps: number[];   
  intervals: number[];
  endpoints: Set<string>;
  errorCount: number;
  lastReqTime: number;
}

@Injectable()
export class AttackCacheService {
  private ipCache = new Map<string, IpData>();

  private globalTimestamps: number[] = [];

  async processRequestAndGetFeatures(ip: string, path: string) {
    const now = Date.now();
    const windowStart = now - 60_000; 

    this.globalTimestamps.push(now);
    while (this.globalTimestamps.length > 0 && this.globalTimestamps[0] < windowStart) {
      this.globalTimestamps.shift();
    }

    let data = this.ipCache.get(ip);
    if (!data) {
      data = {
        reqTimestamps: [],
        intervals: [],
        endpoints: new Set<string>(),
        errorCount: 0,
        lastReqTime: now,
      };
      this.ipCache.set(ip, data);
    }

    data.reqTimestamps.push(now);
    while (data.reqTimestamps.length > 0 && data.reqTimestamps[0] < windowStart) {
      data.reqTimestamps.shift();
    }

    data.endpoints.add(path);

    if (data.lastReqTime && data.reqTimestamps.length > 1) {
      const interval = now - data.lastReqTime;
      data.intervals.push(interval);
      if (data.intervals.length > 20) data.intervals.shift();
    }
    data.lastReqTime = now;

    const reqPerMinute = data.reqTimestamps.length;

    const avgReqIntervalMs = data.intervals.length > 0
      ? data.intervals.reduce((a, b) => a + b, 0) / data.intervals.length
      : 2000;

    const errorRate = data.reqTimestamps.length > 0
      ? data.errorCount / data.reqTimestamps.length
      : 0;

    const uniqueIpsInWindow = this.countActiveIps(windowStart);

    return {
      reqPerMinute,
      avgReqIntervalMs,
      endpointsCount: data.endpoints.size,
      errorRate,
      window_total_req: this.globalTimestamps.length,  
      unique_ips_in_window: uniqueIpsInWindow,
    };
  }

  private countActiveIps(windowStart: number): number {
    let count = 0;
    for (const [, data] of this.ipCache) {
      if (data.reqTimestamps.length > 0 && data.reqTimestamps[data.reqTimestamps.length - 1] >= windowStart) {
        count++;
      }
    }
    return count;
  }

  incrementErrorRate(ip: string) {
    const data = this.ipCache.get(ip);
    if (data) {
      data.errorCount++;
    }
  }
}