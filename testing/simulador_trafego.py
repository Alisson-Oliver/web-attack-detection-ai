import requests
import time
import random
import threading
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "http://localhost:3050"

ENDPOINTS_CATALOGO = ["/api/produtos", "/api/jogos", "/api/softwares", "/api/promocoes", "/api/lancamentos"]
ENDPOINT_LOGIN = "/api/login"

HEADERS_HUMAN = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br"
}
HEADERS_BOT = {
    "User-Agent": "python-requests/2.28.1"
}

import random
import requests

def fazer_requisicao(endpoint, method="GET", is_human=True):
    url = f"{BASE_URL}{endpoint}"
    
    #ip_falso = f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}"
    
    ip_falso = "192.168.1.100"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" if is_human else "python-requests/2.28.1",
        "X-Forwarded-For": ip_falso
    }
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=2)
        else:
            payload = {"user": "admin", "pass": f"senha{random.randint(1, 1000)}"}
            response = requests.post(url, headers=headers, json=payload, timeout=2)
            
        print(f"[{response.status_code}] IP: {ip_falso} | {method} {endpoint} - Decisão: {response.text}")
    except requests.exceptions.RequestException as e:
        pass

def simular_humano():
    print("\n[+] Iniciando simulação de Humano (Navegação Lenta)...")
    while True:
    #for _ in range(10):
        endpoint = random.choice(ENDPOINTS_CATALOGO)
        fazer_requisicao(endpoint, method="GET", is_human=True)
        time.sleep(random.uniform(2.0, 5.0))

def simular_scraping():
    print("\n🕵️‍♂️ Iniciando Bot Furtivo (Scraping)...")
    print("O bot vai tentar mapear o servidor devagar para enganar a segurança.")
    
    ip_furtivo = f"192.168.100.{random.randint(1, 255)}"
    
    headers = {
        "X-Forwarded-For": ip_furtivo,
        "User-Agent": "python-requests/2.28.1" 
    }
    
    for i in range(1, 26):
        endpoint = f"/api/pasta_secreta_admin_{i}"
        url = f"{BASE_URL}{endpoint}"
        
        try:
            response = requests.get(url, headers=headers, timeout=5)
            print(f"[{response.status_code}] IP: {ip_furtivo} | GET {endpoint} -> Resposta do Servidor: {response.text}")
        except requests.exceptions.RequestException:
            print("Erro de conexão (O servidor pode ter cortado a ligação).")
            
        time.sleep(random.uniform(0.5, 1.5))
        
    print("Scraping finalizado.")
        
def simular_brute_force():
    print("\n[+] Iniciando simulação de Força Bruta (Roubo de contas)...")
    for _ in range(250):
        fazer_requisicao(ENDPOINT_LOGIN, method="POST", is_human=False)
        time.sleep(0.2)

def simular_ddos():
    print("\n[+] Iniciando simulação de DDoS com Ramp-up (Aceleração Gradual)...")
    
    def disparo_rapido():
        fazer_requisicao(random.choice(ENDPOINTS_CATALOGO), method="GET", is_human=False)

    with ThreadPoolExecutor(max_workers=50) as executor:
        print("-> Fase 1: Aquecimento (Enganando a IA)...")
        for _ in range(20):
            executor.submit(disparo_rapido)
            time.sleep(0.3) 
            
        print("\n-> Fase 2: Transição. O limite do Redis começa a encher...")
        for _ in range(50):
            executor.submit(disparo_rapido)
            time.sleep(0.05)
            
        print("\n-> Fase 3: Rajada Máxima! O bloqueio (BLOCK) vai acontecer agora.")
        for _ in range(1000):
            executor.submit(disparo_rapido)

if __name__ == "__main__":
    print("="*40)
    print("   TESTE DE CARGA & DETECÇÃO DE IA")
    print("="*40)
    print("1. Simular Humano")
    print("2. Simular Scraping (Bot Furtivo)")
    print("3. Simular Força Bruta (Roubo de conta)")
    print("4. Simular DDoS (Volumétrico)")
    print("="*40)
    
    escolha = input("Escolha o tipo de tráfego para enviar: ")
    
    if escolha == '1':
        simular_humano()
    elif escolha == '2':
        simular_scraping()
    elif escolha == '3':
        simular_brute_force()
    elif escolha == '4':
        simular_ddos()
    else:
        print("Opção inválida.")