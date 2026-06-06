import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AttackCacheService } from './attack-cache.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AttackMiddleware implements NestMiddleware {
  private readonly logger = new Logger('SecurityAudit');
  private readonly FASTAPI_URL = 'http://localhost:8000/predict';

  private readonly auditLogPath = path.join(process.cwd(), 'security_audit.log');

  private stats = {
    totalReqs: 0,
    allowed: 0,
    bouncerBlocked: 0,
    aiBlocked: 0,
    aiCaptcha: 0,
    aiFailures: 0
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly botnetCacheService: AttackCacheService 
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const pathUrl = req.originalUrl;
    const method = req.method;
    
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress || 'unknown';

    if (pathUrl.startsWith('/docs') || pathUrl.startsWith('/favicon') || pathUrl.startsWith('/api-docs')) {
      return next();
    }

    this.stats.totalReqs++;

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
      const response$ = this.httpService.post(this.FASTAPI_URL, aiPayload, { timeout: 5000 });
      const { data } = await firstValueFrom(response$);
      
      const decision = data?.action || 'ok';
      const score = parseFloat(data?.score || 0);

      this.logger.log(`IP: ${clientIp} | Rota: ${pathUrl} | IA Decisão: ${decision.toUpperCase()} | Score: ${score.toFixed(2)}`);

      if (decision === 'block' || decision === 'bloquear') {
        this.stats.aiBlocked++;
        this.writeAuditLog(clientIp, pathUrl, 'AI_BLOCK', features.reqPerMinute, score);
        res.set('X-WAF-Decision', 'BLOCK');
        return res.status(403).json({ message: 'Acesso Bloqueado por Política de Segurança.' });
      } else if (decision === 'captcha') {
        this.stats.aiCaptcha++;
        this.writeAuditLog(clientIp, pathUrl, 'AI_CAPTCHA', features.reqPerMinute, score);
        res.set('X-WAF-Decision', 'CAPTCHA');
        return res.status(401).json({ message: 'Verificação Necessária (CAPTCHA).' });
      } else {
        this.stats.allowed++;
        res.set('X-WAF-Decision', 'ALLOW');
      }

    } catch (httpError) {
      this.stats.aiFailures++;
      this.stats.allowed++; 
      // this.logger.warn(`IA indisponível. Fail-Open aplicado. IP: ${clientIp}`);
    }

    res.on('finish', () => {
        if (res.statusCode >= 400 && res.statusCode !== 429 && res.statusCode !== 401 && res.statusCode !== 403) { 
          this.botnetCacheService.incrementErrorRate(clientIp);
        }
    });

    next();
  }

  private writeAuditLog(ip: string, route: string, action: string, rate: number, score: number) {
    const auditLog = {
      timestamp: new Date().toISOString(),
      level: 'SECURITY_AUDIT',
      ip, route, action,
      metrics: { reqPerMinute: rate, aiThreatScore: score }
    };
    
    fs.appendFile(this.auditLogPath, JSON.stringify(auditLog) + '\n', (err) => {
      if (err) this.logger.error(`Falha ao escrever no audit log: ${err.message}`);
    });
  }
}