from pydantic import BaseModel

class InputData(BaseModel):
    req_per_minute: float
    avg_req_interval_ms: float
    distinct_endpoints_accessed: int
    error_rate: float
    user_agent_is_known: int
    missing_standard_headers: int
    is_post_request: int
    is_datacenter_ip: int
    window_total_req: int
    unique_ips_in_window: int
    payload_size_bytes: float  