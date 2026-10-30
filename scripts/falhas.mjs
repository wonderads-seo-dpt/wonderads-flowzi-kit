// Lê o registo do treino (treino/servidor.log) e diz, em português, porque não arrancou e o que fazer.
const CASOS = [
  [/EADDRINUSE|address already in use/i, 'A porta 9400 está ocupada por outro programa. Correr node scripts/treino.mjs --parar e tentar outra vez; se continuar, reiniciar o computador.'],
  [/SELF_SIGNED_CERT|UNABLE_TO_GET_ISSUER_CERT|UNABLE_TO_VERIFY_LEAF|CERT_HAS_EXPIRED|ERR_TLS_CERT/i, 'A ligação segura à internet está a ser interceptada, normalmente por um antivírus (ESET, Kaspersky, Avast) ou pela rede da empresa. O treino já usa os certificados do Windows quando o Node o permite: actualizar o Node.js para a versão LTS mais recente (https://nodejs.org). Se continuar, testar no hotspot do telemóvel e, se aí funcionar, pedir a quem gere a rede para deixar passar registry.npmjs.org e wordpress.org.'],
  [/ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ECONNRESET|ECONNREFUSED|fetch failed|network|getaddrinfo/i, 'Não consegui descarregar o WordPress e o Elementor. Confirmar a internet; numa rede da empresa, testar no hotspot do telemóvel.'],
  [/ENOSPC|no space left/i, 'O disco está cheio. Libertar uns 2 GB e tentar outra vez.'],
  [/EPERM|EBUSY|EACCES|operation not permitted|resource busy/i, 'Um ficheiro do treino está bloqueado, normalmente pelo OneDrive ou por um antivírus. Se a pasta estiver no OneDrive, mudá-la para C:\\Users\\<nome>. Depois reiniciar o computador e tentar outra vez.'],
  [/EINTEGRITY|ENOTEMPTY|Cannot find module|ERR_MODULE_NOT_FOUND/i, 'A cópia do Playground que o npm guardou ficou a meio. Correr node scripts/treino.mjs --limpar-cache, que a apaga e volta a levantar o treino.'],
  [/is not recognized|reconhecido|command not found/i, 'O Node.js não está bem instalado. Reinstalar a versão LTS de https://nodejs.org e fechar o VS Code por completo antes de voltar a abrir.'],
];

export function explicar(registo) {
  const caso = CASOS.find(([padrao]) => padrao.test(registo));
  return caso ? caso[1] : 'Mostrar as últimas linhas de treino/servidor.log e enviar à Flowzi.';
}
