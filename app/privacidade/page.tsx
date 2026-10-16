export const metadata = { title: 'Política de Privacidade', robots: { index: false } };

export default function PrivacidadePage() {
  return (
    <main style={{ maxWidth: 720, margin: '3rem auto', padding: '0 1.5rem', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>Política de Privacidade</h1>
      <p>Esta política descreve como coletamos, usamos e protegemos os dados pessoais dos usuários deste aplicativo, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '1.5rem' }}>Quais dados coletamos</h2>
      <p>Coletamos os dados fornecidos no cadastro (nome, e-mail) e os gerados pelo uso normal do app, sempre com a finalidade de prestar o serviço.</p>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '1.5rem' }}>Como usamos os dados</h2>
      <p>Usamos os dados apenas para operar o app, autenticar o usuário e, quando aplicável, comunicar novidades ou avisos relacionados ao serviço.</p>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '1.5rem' }}>Seus direitos</h2>
      <p>Você pode solicitar a qualquer momento a correção, exportação ou exclusão dos seus dados, entrando em contato pelos canais informados no app.</p>
      <p style={{ marginTop: '2rem', color: '#666', fontSize: '0.9rem' }}>Última atualização: {new Date().toLocaleDateString('pt-BR')}.</p>
    </main>
  );
}
