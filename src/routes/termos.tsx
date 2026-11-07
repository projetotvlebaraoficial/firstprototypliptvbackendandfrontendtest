import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc } from "@/components/site/PageShell";
import { company, formatBRL, plan } from "@/lib/site";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — TV Lebara" },
      { name: "description", content: "Termos de Uso da plataforma TV Lebara: conta, assinatura, pagamentos, cancelamento e uso dos conteúdos." },
      { property: "og:title", content: "Termos de Uso — TV Lebara" },
      { property: "og:description", content: "Regras de uso da plataforma e da assinatura TV Lebara." },
    ],
  }),
  component: Termos,
});

function Termos() {
  return (
    <LegalDoc title="Termos de Uso" version="1.0" updated="14/10/2026">
      <h2>1. Quem somos</h2>
      <p>A TV Lebara é uma plataforma de streaming operada pela {company.legalName}, inscrita no CNPJ sob o nº {company.cnpj} ("TV Lebara", "nós"). Contato: <a href={`mailto:${company.email}`}>{company.email}</a>.</p>
      <p>A plataforma reúne transmissões ao vivo, entrevistas, palestras, podcasts e outros conteúdos relacionados às religiões de matriz africana e às suas tradições culturais, espirituais e históricas.</p>

      <h2>2. Objeto</h2>
      <p>Estes Termos regulam o acesso ao site, a criação de conta, a contratação da assinatura e o uso dos conteúdos. Ao criar uma conta ou contratar o plano, você declara ter lido e concordado com estes Termos. O tratamento de dados pessoais é descrito na <Link to="/privacidade">Política de Privacidade</Link>.</p>

      <h2>3. Conta de usuário</h2>
      <ul>
        <li>Para criar uma conta, é preciso ter 18 anos ou mais, ou estar assistido(a) por pais ou responsáveis legais, que respondem pelo uso da conta.</li>
        <li>Cada conta é pessoal e intransferível.</li>
        <li>Você deve fornecer informações verdadeiras, completas e atualizadas, e mantê-las corretas na área "Minha conta".</li>
      </ul>

      <h2>4. Confirmação de e-mail e segurança das credenciais</h2>
      <p>O acesso é liberado após a confirmação do e-mail informado no cadastro. Você é responsável por manter sua senha em sigilo e por avisar a TV Lebara pelo e-mail oficial caso suspeite de uso indevido da sua conta.</p>

      <h2>5. Uso da plataforma</h2>
      <p>A plataforma deve ser usada para fins pessoais e não comerciais, de forma compatível com a lei, com estes Termos e com o respeito às tradições e às pessoas representadas nos conteúdos.</p>

      <h2>6. Programação ao vivo e conteúdos gravados</h2>
      <ul>
        <li>As transmissões ao vivo acontecem conforme a grade divulgada, que pode ser alterada por motivos operacionais. Mudanças relevantes serão comunicadas na própria plataforma.</li>
        <li>Os conteúdos gravados ficam disponíveis enquanto a TV Lebara tiver autorização para exibi-los. Alguns podem ser retirados por decisão de seus autores ou titulares de direitos.</li>
        <li>Parte das transmissões pode ser exibida por meio de serviços de terceiros incorporados à plataforma, como o YouTube, que possuem seus próprios termos.</li>
        <li>O acesso depende de conexão à internet e de dispositivo e navegador compatíveis.</li>
        <li>Cada conteúdo informa sua <Link to="/classificacao-indicativa">classificação indicativa</Link>.</li>
      </ul>

      <h2>7. Direitos autorais e propriedade intelectual</h2>
      <p>Os conteúdos, marcas, logotipos e materiais da plataforma pertencem à TV Lebara ou aos seus respectivos titulares e são protegidos pela legislação de direitos autorais (Lei nº 9.610/1998). A assinatura concede apenas uma licença pessoal, limitada e revogável para assistir aos conteúdos na plataforma. Não é permitido gravar, baixar, copiar, retransmitir, vender ou exibir publicamente os conteúdos sem autorização por escrito.</p>

      <h2>8. Condutas proibidas</h2>
      <ul>
        <li>Compartilhar login e senha com outras pessoas ou vender acesso à conta.</li>
        <li>Fraudar pagamentos, usar dados de terceiros ou cartões sem autorização.</li>
        <li>Tentar invadir, sobrecarregar ou explorar vulnerabilidades da plataforma.</li>
        <li>Burlar mecanismos de controle de acesso ou de proteção dos conteúdos.</li>
        <li>Usar a plataforma para ofender, discriminar ou praticar intolerância religiosa, crime previsto em lei.</li>
      </ul>

      <h2>9. Plano de assinatura e preço</h2>
      <p>A TV Lebara oferece os planos Premium (1 TV) e Premium Plus (até 3 TVs), com valores a partir de {formatBRL(plan.priceCents)} por mês e opções trimestral, semestral e anual. O valor efetivamente cobrado é sempre o exibido na tela de pagamento, antes da sua confirmação. Alterações de preço serão comunicadas com antecedência mínima de 30 dias e só valerão para as renovações seguintes, podendo você cancelar caso não concorde.</p>

      <h2>10. Renovação automática e cancelamento</h2>
      <ul>
        <li>Ao contratar, você autoriza a cobrança mensal recorrente no meio de pagamento escolhido, até que cancele.</li>
        <li>Você pode cancelar a renovação a qualquer momento na área de assinante ou pelo e-mail oficial, sem multa.</li>
        <li>Após o cancelamento, nenhuma nova cobrança será feita, e o acesso permanece até o fim do período já pago.</li>
        <li>Você pode exercer o direito de arrependimento em até 7 dias após a contratação, com devolução integral do valor pago, nos termos do art. 49 do Código de Defesa do Consumidor.</li>
      </ul>

      <h2>11. Pagamentos, pendências, recusas e estornos</h2>
      <p>Os pagamentos são processados pelo Mercado Pago. A TV Lebara não armazena os dados completos do seu cartão. Se um pagamento for recusado ou ficar pendente, o acesso de assinante pode ficar suspenso até a regularização, e você será avisado(a). Cobranças indevidas ou em duplicidade serão estornadas. Pedidos de reembolso fora das hipóteses acima serão analisados conforme a legislação de defesa do consumidor.</p>

      <h2>12. Manutenção e indisponibilidade</h2>
      <p>A plataforma pode ficar temporariamente indisponível para manutenção, atualizações ou por falhas de terceiros (internet, hospedagem, provedores). Sempre que possível, avisaremos com antecedência. Interrupções prolongadas atribuíveis à TV Lebara serão tratadas conforme a lei, inclusive quanto a eventual compensação proporcional.</p>

      <h2>13. Suspensão e encerramento da conta</h2>
      <p>A TV Lebara poderá suspender ou encerrar contas que violem estes Termos, de forma proporcional à gravidade da conduta e, sempre que possível, com aviso prévio e oportunidade de esclarecimento. Você pode encerrar sua conta a qualquer momento; se houver assinatura ativa, informaremos como ela será tratada antes da conclusão.</p>

      <h2>14. Atendimento</h2>
      <p>O atendimento geral é feito pelo e-mail <a href={`mailto:${company.email}`}>{company.email}</a>. Assinantes ativos contam também com atendimento por WhatsApp na área de assinante.</p>

      <h2>15. Dados pessoais</h2>
      <p>O tratamento de dados pessoais segue a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e está detalhado na <Link to="/privacidade">Política de Privacidade</Link> e na <Link to="/cookies">Política de Cookies</Link>.</p>

      <h2>16. Responsabilidade</h2>
      <p>A TV Lebara responde pelos serviços que presta nos termos da lei. Nada nestes Termos afasta direitos garantidos ao consumidor. A TV Lebara não responde por danos causados exclusivamente por uso indevido da conta pelo próprio usuário ou por terceiros a quem ele tenha fornecido suas credenciais. As opiniões expressas por convidados representam a visão de cada pessoa.</p>

      <h2>17. Alterações destes Termos</h2>
      <p>Estes Termos podem ser atualizados. Mudanças relevantes serão comunicadas por e-mail ou na plataforma com antecedência razoável, indicando a nova versão e a data de vigência.</p>

      <h2>18. Legislação aplicável</h2>
      <p>Estes Termos seguem as leis brasileiras, incluindo o Código de Defesa do Consumidor e o Marco Civil da Internet (Lei nº 12.965/2014). Fica eleito o foro do domicílio do consumidor para resolver eventuais conflitos.</p>
    </LegalDoc>
  );
}
