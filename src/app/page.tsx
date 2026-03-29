'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

// --- FUNÇÕES DE FETCH EXTERNAS PARA O REACT QUERY ---
const fetchSubPageData = async (pageId: string) => {
  const res = await fetch('/api/get-page-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page_id: pageId }),
  });
  if (!res.ok) throw new Error('Erro ao buscar sub-página');
  return res.json();
};

const fetchDatabaseData = async (dbId: string) => {
  const res = await fetch('/api/get-database-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ database_id: dbId }),
  });
  if (!res.ok) throw new Error('Erro ao buscar tabela');
  return res.json();
};

// --- COMPONENTES ---

function NotionSubPage({ pageId, title }: { pageId: string; title: string }) {
  const [isOpen, setIsOpen] = useState(false);

  // Gerencia o loading, os dados e o cache
  const { data, isLoading } = useQuery({
    queryKey: ['page', pageId],
    queryFn: () => fetchSubPageData(pageId),
    enabled: isOpen, // Só faz o fetch quando a sanfona é aberta!
  });

  const blocks = data?.blocks || [];

  return (
    <div className="my-4 border border-green-300 rounded-lg overflow-hidden shadow-sm bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-3 bg-green-50 hover:bg-green-100 font-semibold text-green-800 flex justify-between items-center transition-colors"
      >
        <span>📄 {title}</span>
        <span className="text-sm">{isOpen ? '▼ Fechar' : '▶ Abrir'}</span>
      </button>

      {isOpen && (
        <div className="p-5 border-t border-green-200">
          {isLoading ? (
            <div className="text-green-600 animate-pulse text-sm">
              ⏳ Carregando conteúdo interno...
            </div>
          ) : blocks.length === 0 ? (
            <div className="text-gray-400 text-sm italic">
              Esta sub-página está vazia.
            </div>
          ) : (
            <div className="pl-4 border-l-2 border-green-100 flex flex-col gap-2">
              {blocks.map((block: any) => (
                <RenderBlock key={block.id} block={block} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotionDatabase({ dbId, title }: { dbId: string; title: string }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  // Estado para guardar os dados da nova linha dinamicamente
  const [newRowData, setNewRowData] = useState<Record<string, string>>({});

  // 1. Busca os dados
  const { data, isLoading } = useQuery({
    queryKey: ['database', dbId],
    queryFn: () => fetchDatabaseData(dbId),
  });

  // 2. Mutação para adicionar linha
  const addRowMutation = useMutation({
    mutationFn: async (newProperties: Record<string, string>) => {
      // O endpoint precisa estar criado em /api/add-row
      const res = await fetch('/api/add-row', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database_id: dbId, properties: newProperties }),
      });
      if (!res.ok) throw new Error('Erro ao adicionar linha');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database', dbId] });
      setIsAdding(false); // Fecha o formulário
      setNewRowData({}); // Limpa os campos
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg my-4 text-purple-600 animate-pulse">
        ⏳ Carregando registros da tabela: <strong>{title}</strong>...
      </div>
    );
  }

  const rows = data?.rows || [];

  if (rows.length === 0 && !isAdding) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg my-4 flex justify-between items-center text-sm">
        <span className="text-gray-500">
          🗄️ Tabela <strong>{title}</strong> está vazia.
        </span>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-purple-600 text-white px-3 py-1 rounded font-semibold hover:bg-purple-700"
        >
          + Adicionar Primeira Linha
        </button>
      </div>
    );
  }

  // Pega as colunas para montar o cabeçalho e o formulário
  const colunas = rows.length > 0 ? Object.keys(rows[0]) : [];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRowMutation.mutate(newRowData);
  };

  return (
    <div className="my-6 overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
      <div className="bg-purple-600 text-white p-3 font-semibold text-sm flex justify-between items-center">
        <span>🗄️ {title}</span>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-white text-purple-600 px-3 py-1 rounded text-xs font-bold hover:bg-gray-100 transition-colors"
        >
          {isAdding ? 'Cancelar' : '+ Nova Linha'}
        </button>
      </div>

      {/* FORMULÁRIO DE INSERÇÃO DINÂMICO */}
      {isAdding && colunas.length > 0 && (
        <form
          onSubmit={handleAddSubmit}
          className="p-4 bg-purple-50 border-b border-purple-100 flex gap-2 items-end flex-wrap"
        >
          {colunas.map((col) => (
            <div key={col} className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <label className="text-xs font-semibold text-purple-800">
                {col}
              </label>
              <input
                type="text"
                required
                className="p-2 text-sm border border-purple-200 rounded"
                value={newRowData[col] || ''}
                onChange={(e) =>
                  setNewRowData({ ...newRowData, [col]: e.target.value })
                }
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={addRowMutation.isPending}
            className="bg-purple-600 text-white p-2 rounded text-sm font-bold min-w-[100px] disabled:opacity-50"
          >
            {addRowMutation.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      )}

      {/* TABELA COM OS DADOS */}
      <table className="w-full text-left border-collapse bg-white">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200">
            {colunas.map((col) => (
              <th key={col} className="p-3 text-sm font-semibold text-gray-700">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, index: number) => (
            <tr
              key={index}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {colunas.map((col) => (
                <td key={col} className="p-3 text-sm text-gray-800">
                  {row[col] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RenderBlock({ block }: { block: any }) {
  const queryClient = useQueryClient();

  // Mutação para atualizar o checkbox
  const updateBlockMutation = useMutation({
    mutationFn: async (isChecked: boolean) => {
      const res = await fetch('/api/update-block', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block_id: block.id,
          type: 'to_do',
          data: { checked: isChecked },
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      // Invalida a query da página pai para recarregar o estado atualizado
      // NOTA: Na próxima etapa, trocaremos isso por Optimistic UI
      queryClient.invalidateQueries({ queryKey: ['page'] });
    },
  });

  switch (block.type) {
    case 'heading_1':
      return (
        <h1 className="text-3xl font-bold mt-6 mb-2 text-gray-900">
          {block.content}
        </h1>
      );
    case 'heading_2':
      return (
        <h2 className="text-2xl font-bold mt-5 mb-2 text-gray-800">
          {block.content}
        </h2>
      );
    case 'heading_3':
      return (
        <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-700">
          {block.content}
        </h3>
      );
    case 'paragraph':
      return (
        <p className="mb-3 text-gray-800 leading-relaxed">
          {block.content || <br />}
        </p>
      );
    case 'bulleted_list_item':
      return (
        <li className="ml-6 list-disc mb-1 text-gray-800">{block.content}</li>
      );
    case 'numbered_list_item':
      return (
        <li className="ml-6 list-decimal mb-1 text-gray-800">
          {block.content}
        </li>
      );
    case 'to_do':
      return (
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={block.checked}
            onChange={(e) => updateBlockMutation.mutate(e.target.checked)}
            disabled={updateBlockMutation.isPending} // Bloqueia enquanto envia
            className="w-4 h-4 text-blue-600 rounded cursor-pointer disabled:opacity-50"
          />
          <span
            className={
              block.checked ? 'line-through text-gray-400' : 'text-gray-800'
            }
          >
            {block.content}
          </span>
          {updateBlockMutation.isPending && (
            <span className="text-xs text-gray-400">Salvando...</span>
          )}
        </div>
      );
    case 'divider':
      return <hr className="my-6 border-t border-gray-300" />;
    case 'image':
      return (
        <img
          src={block.url}
          alt="Imagem Notion"
          className="max-w-full rounded-lg my-4 shadow-sm border border-gray-200"
        />
      );
    case 'callout':
      return (
        <div className="p-4 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg my-4 flex gap-3">
          <span>💡</span>
          <span>{block.content}</span>
        </div>
      );
    // 👇 A MÁGICA ACONTECE AQUI 👇
    case 'child_database':
      return <NotionDatabase dbId={block.id} title={block.content} />;
    case 'child_page':
      return <NotionSubPage pageId={block.id} title={block.content} />;
    // ---------------------------------
    default:
      return (
        <div className="text-sm text-red-500 my-2">
          [Bloco não mapeado: {block.type}]
        </div>
      );
  }
}

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
          <NotionDatabase
            key={block.id}
            dbId={block.id}
            title={block.content}
          />
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

          <div className="notion-content">
            {pageBlocks.map((block) => (
              <RenderBlock key={block.id} block={block} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
