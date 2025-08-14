#!/usr/bin/env node

import { spawn } from 'child_process';

// Função para testar o servidor MCP
async function testMcpServer() {
  console.log('🚀 Iniciando teste do servidor MCP...\n');

  const serverProcess = spawn('node', ['build/main.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseBuffer = '';

  serverProcess.stdout.on('data', (data) => {
    responseBuffer += data.toString();
  });

  serverProcess.stderr.on('data', (data) => {
    console.log('Server stderr:', data.toString());
  });

  // Enviar mensagem de inicialização
  const initMessage = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  }) + '\n';

  console.log('📤 Enviando mensagem de inicialização...');
  serverProcess.stdin.write(initMessage);

  // Aguardar resposta
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Listar tools disponíveis
  const listToolsMessage = JSON.stringify({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  }) + '\n';

  console.log('📤 Listando tools disponíveis...');
  serverProcess.stdin.write(listToolsMessage);

  // Aguardar resposta
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Testar uma tool
  const testToolMessage = JSON.stringify({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "get-acoes",
      arguments: {
        stocks: ["PETR4"]
      }
    }
  }) + '\n';

  console.log('📤 Testando tool get-acoes com PETR4...');
  serverProcess.stdin.write(testToolMessage);

  // Aguardar resposta final
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('\n📥 Respostas recebidas:');
  console.log(responseBuffer);

  serverProcess.kill();
}

testMcpServer().catch(console.error);
