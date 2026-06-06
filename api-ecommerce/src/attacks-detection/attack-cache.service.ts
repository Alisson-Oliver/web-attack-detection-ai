import { Injectable } from '@nestjs/common';

interface IpData {
  reqCount: number;
  lastReqTime: number;
  intervals: number[];
  endpoints: Set<string>;
  errorCount: number;
}

@Injectable()
export class AttackCacheService {
  private ipCache = new Map<string, IpData>();
  
  private activeIps = new Set<string>();
  private globalReqCount = 0;
  private lastReset = Date.now();

  async processRequestAndGetFeatures(ip: string, path: string) {
    const now = Date.now();

    if (now - this.lastReset > 60000) {
      this.ipCache.clear();
      this.activeIps.clear();
      this.globalReqCount = 0;
      this.lastReset = now;
    }

    this.globalReqCount++;
    this.activeIps.add(ip);

    let data = this.ipCache.get(ip);
    if (!data) {
      data = {
        reqCount: 0,
        lastReqTime: now,
        intervals: [],
        endpoints: new Set<string>(),
        errorCount: 0,
      };
      this.ipCache.set(ip, data);
    }

    data.reqCount++;
    data.endpoints.add(path);

    if (data.reqCount > 1) {
      const interval = now - data.lastReqTime;
      data.intervals.push(interval);
      if (data.intervals.length > 20) data.intervals.shift(); 
    }
    data.lastReqTime = now;

    const avgReqIntervalMs = data.intervals.length > 0
      ? data.intervals.reduce((a, b) => a + b, 0) / data.intervals.length
      : 2000; 
    
    const errorRate = data.reqCount > 0 ? (data.errorCount / data.reqCount) : 0;

    return {
      reqPerMinute: data.reqCount,
      avgReqIntervalMs,
      endpointsCount: data.endpoints.size,
      errorRate,
      
      window_total_req: this.globalReqCount,
      unique_ips_in_window: this.activeIps.size
    };
  }

  incrementErrorRate(ip: string) {
    const data = this.ipCache.get(ip);
    if (data) {
      data.errorCount++;
    }
  }
}