import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc } from "@/components/site/PageShell";
import { company } from "@/lib/site";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — TV Lebara" },
      { name: "description", content: "Como a TV Lebara trata seus dados pessoais, conforme a LGPD." },
      { property: "og:title", content: "Política de Privacidade — TV Lebara" },
      { property: "og:description", content: "Coleta, uso, compartilhamento e proteção de dados pessoais na TV Lebara." },
    ],
  }),
  component: Privacidade,
});

const rows = [
  ["Nome e sobrenome", "Obrigatório", "Identificar você e personalizar o atendimento", "Execução de contrato"],
  ["E-mail", "Obrigatório", "Login, confirmação de conta e avisos sobre a assinatura", "Execução de contrato"],
  ["Telefone", "Obrigatório", "Suporte e contato sobre a conta", "Execução de contrato"],
  ["CPF", "Obrigatório", "Emissão de cobrança, prevenção a fraudes e obrigações fiscais", "Obrigação legal e execução de contrato"],
  ["Endereço e RG", "Opcional ou quando exigido", "Cobrança e obrigações legais, quando aplicável", "Obrigação legal"],
  ["Foto de perfil", "Opcional", "Exibição na sua área pessoal", "Execução de contrato"],
  ["Dados de pagamento", "Obrigatório para assinar", "Processar cobranças (pelo Mercado Pago)", "Execução de contrato"],
  ["Dados de uso (acessos, IP, dispositivo)", "Automático", "Segurança, prevenção a fraudes e registros exigidos pelo Marco Civil", "Obrigação legal e legítimo interesse"],
];

function Privacidade() {
  return (
    <LegalDoc title="Política de Privacidade" version="1.0" updated="14/10/2026">
      <p>Esta Política explica, de forma direta, como a TV Lebara trata dados pessoais, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).</p>

      <h2>1. Controlador</h2>
      <p>{company.legalName}, CNPJ {company.cnpj}, responsável pela TV Lebara. Contato para privacidade: <a href={`mailto:${company.email}`}>{company.email}</a>.</p>

      <h2>2. Dados tratados, finalidades e bases legais</h2>
      <div className="mb-6 overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted"><tr>{["Dado", "Tipo", "Finalidade", "Base legal"].map((h) => <th key={h} className="p-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r) => <tr key={r[0]} className="border-t">{r.map((c) => <td key={c} className="p-3 align-top">{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <p>Também podemos tratar dados para o exercício regular de direitos em processos judiciais ou administrativos. O consentimento só é pedido quando for de fato necessário, como para cookies não essenciais, e pode ser revogado a qualquer momento. Ler esta Política não equivale a consentir com todo tratamento: ela informa como os dados são usados.</p>
      <p>CPF, RG, endereço e foto de perfil não são usados para publicidade nem para finalidades diferentes das descritas aqui.</p>

      <h2>3. Autenticação</h2>
      <p>O cadastro e o login são processados por um provedor de autenticação contratado para a plataforma, que armazena e-mail e senha de forma protegida (a senha é guardada criptografada, sem possibilidade de leitura pela equipe).</p>

      <h2>4. Pagamentos</h2>
      <p>As cobranças são processadas pelo Mercado Pago. Os dados completos do cartão são informados diretamente ao Mercado Pago e não são armazenados pela TV Lebara. Recebemos apenas informações necessárias para registrar a assinatura, como status do pagamento, valor, data e identificadores da transação.</p>

      <h2>5. Compartilhamento</h2>
      <p>A TV Lebara compartilha dados apenas quando necessário para prestar o serviço, com:</p>
      <ul>
        <li>provedores de hospedagem, banco de dados, armazenamento e autenticação;</li>
        <li>Mercado Pago, para processar pagamentos;</li>
        <li>serviços de vídeo incorporados, como o YouTube, quando você assiste a uma transmissão exibida por eles;</li>
        <li>autoridades públicas, quando houver obrigação legal ou ordem judicial.</li>
      </ul>
      <p>Não vendemos dados pessoais.</p>

      <h2>6. Transferência internacional</h2>
      <p>Alguns fornecedores podem armazenar dados em servidores fora do Brasil. Nesses casos, exigimos garantias contratuais de proteção compatíveis com a LGPD, como prevê o art. 33.</p>

      <h2>7. Retenção</h2>
      <ul>
        <li>Dados da conta: enquanto a conta estiver ativa.</li>
        <li>Registros de acesso: no mínimo 6 meses, conforme o Marco Civil da Internet.</li>
        <li>Dados de pagamento e fiscais: pelo prazo exigido pela legislação fiscal e consumerista (em geral, 5 anos).</li>
        <li>Após esses prazos, os dados são eliminados ou anonimizados.</li>
      </ul>

      <h2>8. Segurança</h2>
      <p>Adotamos conexão criptografada, controle de acesso por permissões, senhas protegidas, armazenamento privado de arquivos sensíveis e registro de ações administrativas. Nenhum sistema é totalmente imune a falhas, por isso também mantemos procedimentos de resposta a incidentes.</p>

      <h2>9. Incidentes de segurança</h2>
      <p>Se ocorrer um incidente que possa causar risco ou dano relevante, comunicaremos a Autoridade Nacional de Proteção de Dados (ANPD) e as pessoas afetadas, nos prazos e na forma da regulamentação vigente.</p>

      <h2>10. Seus direitos</h2>
      <p>Pela LGPD (art. 18), você pode pedir: confirmação de que tratamos seus dados; acesso; correção; anonimização, bloqueio ou eliminação de dados desnecessários; portabilidade, quando aplicável; informação sobre compartilhamentos; informação sobre a possibilidade de não consentir; revogação do consentimento; e revisão de decisões automatizadas.</p>

      <h2>11. Como exercer seus direitos</h2>
      <p>Envie seu pedido para <a href={`mailto:${company.email}`}>{company.email}</a>. Cada pedido recebe um número de protocolo. Poderemos pedir uma confirmação simples de identidade, proporcional ao risco, sem exigir dados excessivos. Responderemos nos prazos legais.</p>

      <h2>12. Exclusão de conta</h2>
      <p>Você pode pedir a exclusão da sua conta. Se houver assinatura ativa, avisaremos antes como ficarão a renovação e as cobranças futuras. Alguns dados podem ser mantidos pelo tempo exigido por lei ou para defesa de direitos; nesse caso, informaremos quais e por quê.</p>

      <h2>13. Crianças e adolescentes</h2>
      <p>A conta deve ser criada por maiores de 18 anos ou com assistência de pais ou responsáveis. Dados de crianças só serão tratados com consentimento específico de um dos pais ou responsável, no melhor interesse da criança, conforme o art. 14 da LGPD.</p>

      <h2>14. Encarregado (DPO)</h2>
      <p>As solicitações relacionadas à proteção de dados podem ser enviadas ao canal <a href={`mailto:${company.email}`}>{company.email}</a>. A identificação do encarregado será publicada nesta página assim que formalizada.</p>

      <h2>15. Cookies</h2>
      <p>Veja a <Link to="/cookies">Política de Cookies</Link>.</p>

      <h2>16. Alterações</h2>
      <p>Esta Política pode ser atualizada. Mudanças relevantes serão comunicadas na plataforma ou por e-mail, com indicação da nova versão e data.</p>
    </LegalDoc>
  );
}
