# Como rodar o front localmente

Este projeto é uma aplicação front-end baseada em Vite + React.

## Pré-requisitos

- Node.js instalado (recomenda-se versão 18 ou superior)
- Um gerenciador de pacotes: `npm`, `pnpm`, `yarn` ou `bun`

## Passos para rodar localmente

1. Abra o terminal na raiz do projeto:

2. Instale as dependências:
   - Usando npm:
     ```bash
     npm install
     ```
   - Usando pnpm:
     ```bash
     pnpm install
     ```
   - Usando yarn:
     ```bash
     yarn install
     ```
   - Usando Bun:
     ```bash
     bun install
     ```

3. Inicie o servidor de desenvolvimento:
   - Usando npm:
     ```bash
     npm run dev
     ```
   - Usando pnpm:
     ```bash
     pnpm dev
     ```
   - Usando yarn:
     ```bash
     yarn dev
     ```
   - Usando Bun:
     ```bash
     bun run dev
     ```

4. Abra o navegador e acesse:
   ```
   http://localhost:5173
   ```

## Observações

- O script de desenvolvimento está definido em `package.json` como `vite dev`.
- Se houver outra aplicação usando a porta `5173`, o Vite pode escolher uma porta diferente.
- Para gerar uma versão de produção, use:
  ```bash
  npm run build
  ```
