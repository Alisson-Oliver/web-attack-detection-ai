from pydantic import BaseModel, Field

class InputData(BaseModel):
    req_per_minute: int = Field(..., description="Quantidade de requisições por minuto do IP", ge=0)
    avg_req_interval_ms: float = Field(..., description="Intervalo médio entre requisições em milissegundos", ge=0.0)
    distinct_endpoints_accessed: int = Field(..., description="Quantidade de endpoints diferentes acessados", ge=1)
    error_rate: float = Field(..., description="Taxa de erros (ex: 401, 403, 404) gerada pelo IP", ge=0.0, le=1.0)
    payload_size_bytes: int = Field(..., description="Tamanho total do payload (corpo) da requisição em bytes", ge=0)
    user_agent_is_known: int = Field(..., description="User-Agent reconhecido como navegador comum? (1 = Sim, 0 = Não)", ge=0, le=1)
    missing_standard_headers: int = Field(..., description="Faltam cabeçalhos HTTP padrão (Accept, etc)? (1 = Sim, 0 = Não)", ge=0, le=1)
    is_post_request: int = Field(..., description="A requisição é do método POST? (1 = Sim, 0 = Não)", ge=0, le=1)
    is_datacenter_ip: int = Field(..., description="O IP tem origem em um Datacenter conhecido? (1 = Sim, 0 = Não)", ge=0, le=1)