# Exemplo 14 — SoundStreaming

Site de streaming de músicas com **recomendação por perfil**: usuários com estilos diferentes; **novo usuário sem histórico** recebe sugestões com base no perfil (idade e padrões aprendidos do modelo).

## Pré-requisitos

- Node.js 18+ (recomendado 22)
- Navegador moderno (Chrome recomendado para tfjs-vis)

## Como rodar

```bash
cd modulo01-fundamentos-de-ia-e-llms-para-programadores/exemplo-14-soundstreamming
npm install
npm start
```

Abre no navegador em **http://localhost:3001**.

## O que fazer

1. Selecione um usuário (incluindo **"Novo Ouvinte"**, que não tem músicas na lista).
2. Clique em **Treinar modelo** e aguarde o fim do treino.
3. Clique em **Ver recomendações**: a lista de músicas será reordenada por score de recomendação. Para o "Novo Ouvinte", as sugestões são baseadas apenas no **perfil (idade)**.

## Documentação completa

Consulte **`DOCUMENTACAO-EXEMPLO-14-SOUNDSTREAMMING.md`** neste diretório (visão geral, mapa da estrutura, arquivo por arquivo, ordem de construção, padrão mental, fluxo de execução).

## Relação com o Exemplo 01

Este projeto repete o **padrão do Exemplo 01 (e-commerce)** em outro domínio: MVC, eventos, Web Worker, TensorFlow.js. A diferença é o domínio (músicas e estilos) e o **cold start** (usuário sem escutas = recomendações só por perfil).
