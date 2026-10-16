export const metadata = { title: 'Termos de Uso', robots: { index: false } };

export default function TermosPage() {
  return (
    <main style={{ maxWidth: 720, margin: '3rem auto', padding: '0 1.5rem', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>Termos de Uso</h1>
      <p>Ao usar este aplicativo, você concorda com os termos abaixo.</p>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '1.5rem' }}>Uso do serviço</h2>
      <p>O serviço deve ser usado de forma lícita, respeitando os demais usuários e a legislação aplicável.</p>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '1.5rem' }}>Conta e responsabilidade</h2>
      <p>Você é responsável por manter suas credenciais em sigilo e pelas ações realizadas na sua conta.</p>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '1.5rem' }}>Alterações</h2>
      <p>Estes termos podem ser atualizados; alterações relevantes serão comunicadas no app.</p>
      <p style={{ marginTop: '2rem', color: '#666', fontSize: '0.9rem' }}>Última atualização: {new Date().toLocaleDateString('pt-BR')}.</p>
    </main>
  );
}
