'use client';

import { useState } from 'react';

export default function Home() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    templateKey: 'TEMPLATE_ID_1',
    templateNome: 'Reinf',
  });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupMessage, setSignupMessage] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [clientData, setClientData] = useState<{
    nome: string;
    status_notion: string;
    page_id: string;
  } | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // NOVO: Estado para guardar os blocos da página
  const [pageBlocks, setPageBlocks] = useState<any[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupMessage('');
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setSignupMessage(`✅ ${data.message}`);
        setFormData({ ...formData, nome: '', email: '' });
      } else setSignupMessage(`❌ Erro: ${data.error}`);
    } catch (err) {
      setSignupMessage('❌ Erro ao conectar com o servidor.');
    } finally {
      setSignupLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    setClientData(null);
    setPageBlocks([]); // Limpa blocos anteriores

    try {
      const response = await fetch('/api/get-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail }),
      });
      const data = await response.json();

      if (response.ok) {
        setClientData(data);
        // NOVO: Chama a função para buscar os blocos assim que logar
        fetchPageContent(data.page_id);
      } else {
        setLoginError(`❌ ${data.error}`);
      }
    } catch (err) {
      setLoginError('❌ Erro de conexão com o servidor.');
    } finally {
      setLoginLoading(false);
    }
  };

  // NOVO: Função que busca os blocos
  const fetchPageContent = async (pageId: string) => {
    setBlocksLoading(true);
    try {
      const response = await fetch('/api/get-page-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: pageId }),
      });
      const data = await response.json();
      if (response.ok && data.blocks) {
        setPageBlocks(data.blocks);
      }
    } catch (err) {
      console.error('Erro ao buscar conteúdo da página.');
    } finally {
      setBlocksLoading(false);
    }
  };

  // NOVO: Função auxiliar que transforma o JSON do Notion em HTML (JSX)
  const renderBlock = (block: any) => {
    switch (block.type) {
      case 'heading_1':
        return (
          <h1 key={block.id} className="text-3xl font-bold mt-6 mb-2">
            {block.content}
          </h1>
        );
      case 'heading_2':
        return (
          <h2 key={block.id} className="text-2xl font-bold mt-5 mb-2">
            {block.content}
          </h2>
        );
      case 'heading_3':
        return (
          <h3
            key={block.id}
            className="text-xl font-semibold mt-4 mb-2 text-gray-700"
          >
            {block.content}
          </h3>
        );
      case 'paragraph':
        return (
          <p key={block.id} className="mb-3 text-gray-800 leading-relaxed">
            {block.content || <br />}
          </p>
        );
      case 'bulleted_list_item':
        return (
          <li key={block.id} className="ml-6 list-disc mb-1">
            {block.content}
          </li>
        );
      case 'numbered_list_item':
        return (
          <li key={block.id} className="ml-6 list-decimal mb-1">
            {block.content}
          </li>
        );
      case 'to_do':
        return (
          <div key={block.id} className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              readOnly
              checked={block.checked}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span
              className={
                block.checked ? 'line-through text-gray-400' : 'text-gray-800'
              }
            >
              {block.content}
            </span>
          </div>
        );
      case 'divider':
        return <hr key={block.id} className="my-6 border-t border-gray-300" />;
      case 'image':
        return (
          <img
            key={block.id}
            src={block.url}
            alt="Imagem Notion"
            className="max-w-full rounded-lg my-4 shadow-sm border border-gray-200"
          />
        );
      case 'callout':
        return (
          <div
            key={block.id}
            className="p-4 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg my-4 flex gap-3"
          >
            <span>💡</span>
            <span>{block.content}</span>
          </div>
        );
      case 'child_page':
        return (
          <div
            key={block.id}
            className="p-4 bg-green-50 border border-green-200 rounded-lg my-4 font-semibold text-green-800"
          >
            📄 Sub-página: {block.content}{' '}
            <span className="text-xs font-normal text-green-600">
              (Recursividade em breve)
            </span>
          </div>
        );
      case 'child_database':
        return (
          <div
            key={block.id}
            className="p-4 bg-purple-50 border border-purple-200 rounded-lg my-4 font-semibold text-purple-800"
          >
            🗄️ Tabela: {block.content}{' '}
            <span className="text-xs font-normal text-purple-600">
              (Leitura de banco em breve)
            </span>
          </div>
        );
      default:
        return (
          <div key={block.id} className="text-sm text-red-500 my-2">
            [Bloco não mapeado: {block.type}]
          </div>
        );
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-10 flex flex-col items-center gap-8">
      {/* ... [OS DOIS CARTÕES (CADASTRO E LOGIN) CONTINUAM AQUI IGUAIS] ... */}
      <div className="flex w-full max-w-5xl gap-8 flex-col md:flex-row items-start">
        <div className="w-full md:w-1/3 flex flex-col gap-8">
          {/* Cartão Cadastro Omitido por brevidade no texto, mas mantenha-o no seu código */}
          <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-blue-500">
            <h2 className="text-2xl font-bold mb-6">Cadastro</h2>
            <form onSubmit={handleSignup} className="space-y-4">
              <input
                type="text"
                placeholder="Nome"
                required
                className="w-full p-3 border rounded-md"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
              />
              <input
                type="email"
                placeholder="E-mail"
                required
                className="w-full p-3 border rounded-md"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <select
                className="w-full p-3 border rounded-md"
                value={formData.templateKey}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    templateKey: e.target.value,
                    templateNome: e.target.options[e.target.selectedIndex].text,
                  })
                }
              >
                <option value="TEMPLATE_ID_1">Reinf</option>
                <option value="TEMPLATE_ID_2">Página qualquer</option>
              </select>
              <button
                type="submit"
                disabled={signupLoading}
                className="w-full py-3 bg-blue-600 text-white rounded-md"
              >
                {signupLoading ? 'Processando...' : 'Cadastrar'}
              </button>
            </form>
          </div>

          {/* Cartão Login */}
          <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-green-500">
            <h2 className="text-2xl font-bold mb-2">Área do Cliente</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                placeholder="Seu e-mail"
                required
                className="w-full p-3 border rounded-md"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-green-600 text-white rounded-md"
              >
                {loginLoading ? 'Buscando...' : 'Acessar'}
              </button>
            </form>
            {clientData && (
              <div className="mt-4 p-4 bg-gray-50 border rounded-md text-center">
                <p>
                  Olá, <strong>{clientData.nome}</strong>!
                </p>
                <p>
                  Status:{' '}
                  <span className="font-bold text-blue-600">
                    {clientData.status_notion}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* --- ÁREA DE RENDERIZAÇÃO DO NOTION --- */}
        <div className="w-full md:w-2/3 bg-white p-8 rounded-xl shadow-lg border-t-4 border-gray-800 min-h-[400px]">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">
            Conteúdo do Projeto
          </h2>

          {blocksLoading && (
            <p className="text-gray-500 animate-pulse">
              Carregando blocos do Notion...
            </p>
          )}

          {!blocksLoading && pageBlocks.length === 0 && (
            <p className="text-gray-400 italic">
              Faça login para ver o conteúdo ou a página está vazia.
            </p>
          )}

          <div className="notion-content">{pageBlocks.map(renderBlock)}</div>
        </div>
      </div>
    </main>
  );
}
