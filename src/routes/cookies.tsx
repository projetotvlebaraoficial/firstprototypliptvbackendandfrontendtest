import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc } from "@/components/site/PageShell";
import { openCookiePreferences } from "@/components/site/CookieConsent";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Política de Cookies — TV Lebara" },
      { name: "description", content: "Quais cookies a TV Lebara utiliza e como gerenciar suas preferências." },
      { property: "og:title", content: "Política de Cookies — TV Lebara" },
      { property: "og:description", content: "Cookies e tecnologias semelhantes usados pela TV Lebara." },
    ],
  }),
  component: () => (
    <LegalDoc title="Política de Cookies" version="1.0" updated="14/10/2026">
      <h2>O que são cookies</h2>
      <p>Cookies e tecnologias semelhantes (como o armazenamento local do navegador) são pequenos arquivos que guardam informações no seu dispositivo para o site funcionar e lembrar escolhas.</p>

      <h2>Estritamente necessários</h2>
      <p><strong>Finalidade:</strong> manter o site funcionando, registrar sua escolha sobre cookies e, quando a área de assinante estiver ativa, manter sua sessão de login segura.</p>
      <p><strong>Dados envolvidos:</strong> registro da sua escolha de cookies (categorias, versão desta política e data) e identificadores de sessão. <strong>Consentimento:</strong> não necessário. <strong>Duração:</strong> até você limpar os dados do navegador ou sair da conta. <strong>Fornecedor:</strong> a própria TV Lebara.</p>

      <h2>Preferências</h2>
      <p>No momento, a TV Lebara não utiliza cookies de preferências.</p>

      <h2>Analíticos e de desempenho</h2>
      <p>No momento, a TV Lebara não utiliza ferramentas de análise. Se passar a utilizar, elas só serão ativadas com o seu consentimento, e esta política será atualizada com os fornecedores e prazos.</p>

      <h2>Publicidade e marketing</h2>
      <p>No momento, a TV Lebara não utiliza cookies ou pixels de publicidade.</p>

      <h2>Conteúdos de terceiros</h2>
      <p>Quando você assiste a uma transmissão exibida pelo YouTube dentro da plataforma, o YouTube pode usar suas próprias tecnologias, conforme a política de privacidade do Google.</p>

      <h2>Como gerenciar</h2>
      <p>Você pode mudar sua escolha a qualquer momento pelo link "Preferências de cookies" no rodapé ou pelo botão abaixo. Também pode apagar os cookies nas configurações do seu navegador.</p>
      <Button onClick={openCookiePreferences}>Preferências de cookies</Button>
    </LegalDoc>
  ),
});
