import { Controller, Get, Post, Param, UnauthorizedException } from '@nestjs/common';

@Controller()
export class AppController {
  
  @Get()
  getHello(): string {
    return "E-commerce Rodando!";
  }

  @Get('api/produtos')
  getProdutos() { return "Lista de Produtos"; }

  @Get('api/jogos')
  getJogos() { return "Lista de Jogos"; }

  @Get('api/softwares')
  getSoftwares() { return "Lista de Softwares"; }

  @Get('api/promocoes')
  getPromocoes() { return "Promoções"; }

  @Get('api/lancamentos')
  getLancamentos() { return "Lançamentos"; }

  @Get('api/produtos/:id')
  getProdutoById(@Param('id') id: string) { return `Produto ${id}`; }

  @Post('api/login')
  fazerLogin() {
    throw new UnauthorizedException('Credenciais inválidas');
  }
}