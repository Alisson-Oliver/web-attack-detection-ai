import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AttackCacheService } from './attack-cache.service';
@Injectable()
export class AttackMiddleware implements NestMiddleware {
  private readonly logger = new Logger('SecurityAudit');
  private readonly FASTAPI_URL = 'http://localhost:8000/predict';
  
  private profileStats = {
    '1. Humano (200.150.*)': { ALLOW: 0, CAPTCHA: 0, BLOCK: 0 },
    '2. Força Bruta (10.0.*)': { ALLOW: 0, CAPTCHA: 0, BLOCK: 0 },
    '3. Scraper (192.168.*)': { ALLOW: 0, CAPTCHA: 0, BLOCK: 0 },
    '4. DoS Single (66.66.*)': { ALLOW: 0, CAPTCHA: 0, BLOCK: 0 },
    '5. Botnet (172.16.*)': { ALLOW: 0, CAPTCHA: 0, BLOCK: 0 },
    'Outros': { ALLOW: 0, CAPTCHA: 0, BLOCK: 0 },
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly botnetCacheService: AttackCacheService 
  ) {
  }

  private getProfileName(ip: string): string {
    if (ip.startsWith('200.150.')) return '1. Humano (200.150.*)';
    if (ip.startsWith('10.0.')) return '2. Força Bruta (10.0.*)';
    if (ip.startsWith('192.168.')) return '3. Scraper (192.168.*)';
    if (ip === '66.66.66.66') return '4. DoS Single (66.66.*)';
    if (ip.startsWith('172.16.')) return '5. Botnet (172.16.*)';
    return 'Outros';
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const pathUrl = req.originalUrl;
    const method = req.method;
    
    if (pathUrl === '/api/admin/live-stats') {
      res.set('Access-Control-Allow-Origin', '*'); 
      return res.status(200).json(this.profileStats);
    }
    
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress || 'unknown';

    const features = await this.botnetCacheService.processRequestAndGetFeatures(clientIp, pathUrl);

    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const contentLengthStr = req.headers['content-length'];
    const contentLength = contentLengthStr ? parseInt(contentLengthStr, 10) : 0;
    
    const isKnownUa = ['mozilla', 'chrome', 'safari', 'edge', 'postman', 'insomnia'].some(ua => userAgent.includes(ua)) ? 1 : 0;
    const hasStandardHeaders = ('accept' in req.headers && 'accept-encoding' in req.headers) ? 1 : 0;

    const aiPayload = {
      req_per_minute: features.reqPerMinute,
      avg_req_interval_ms: features.avgReqIntervalMs,
      distinct_endpoints_accessed: features.endpointsCount,
      error_rate: features.errorRate,
      payload_size_bytes: contentLength, 
      user_agent_is_known: isKnownUa,
      missing_standard_headers: hasStandardHeaders === 0 ? 1 : 0,
      is_post_request: method === 'POST' ? 1 : 0,
      is_datacenter_ip: 0,
      window_total_req: features.window_total_req,
      unique_ips_in_window: features.unique_ips_in_window
    };

    try {
      const response = this.httpService.post(this.FASTAPI_URL, aiPayload, { timeout: 5000 });
      const { data } = await firstValueFrom(response);
      
      const decision = data?.action || 'ok';
      const score = parseFloat(data?.score || 0);

      this.logger.log(`IP: ${clientIp} | Rota: ${pathUrl} | IA Decisão: ${decision.toUpperCase()} | Score: ${score.toFixed(2)}`);

      const profile = this.getProfileName(clientIp);

      if (decision === 'block' || decision === 'bloquear') {
        this.profileStats[profile].BLOCK++;
        res.set('X-WAF-Decision', 'BLOCK');
        return res.status(403).json({ message: 'Acesso Bloqueado por Política de Segurança.' });
      } else if (decision === 'captcha') {
        this.profileStats[profile].CAPTCHA++;
        res.set('X-WAF-Decision', 'CAPTCHA');
        return res.status(401).json({ message: 'Verificação Necessária (CAPTCHA).' });
      } else {
        this.profileStats[profile].ALLOW++;
        res.set('X-WAF-Decision', 'ALLOW');
      }

    } catch (httpError) {
      this.profileStats['Outros'].ALLOW++;
    }

    res.on('finish', () => {
        if (res.statusCode >= 400 && res.statusCode !== 429 && res.statusCode !== 401 && res.statusCode !== 403) { 
          this.botnetCacheService.incrementErrorRate(clientIp);
        }
    });

    next();
  }
}