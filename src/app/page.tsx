'use client';

import { useState } from 'react';

export default function Home() {
  // --- ESTADOS DO CADASTRO ---
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    templateKey: 'TEMPLATE_ID_1',
    templateNome: 'Reinf',
  });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupMessage, setSignupMessage] = useState('');

  // --- ESTADOS DA ÁREA DO CLIENTE ---
  const [loginEmail, setLoginEmail] = useState('');
  const [clientData, setClientData] = useState<{
    nome: string;
    status_notion: string;
    page_id: string;
  } | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // --- FUNÇÃO DE CADASTRO ---
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
      } else {
        setSignupMessage(`❌ Erro: ${data.error}`);
      }
    } catch (err) {
      setSignupMessage('❌ Erro ao conectar com o servidor.');
    } finally {
      setSignupLoading(false);
    }
  };

  // --- FUNÇÃO DE CONSULTA (LOGIN) ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    setClientData(null);

    try {
      const response = await fetch('/api/get-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setClientData(data);
      } else {
        setLoginError(`❌ ${data.error}`);
      }
    } catch (err) {
      setLoginError('❌ Erro de conexão com o servidor.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-10 flex flex-col items-center gap-8">
      {/* --- CARTÃO DE CADASTRO --- */}
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border-t-4 border-blue-500">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Cadastro Evolvi
        </h2>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome do Cliente
            </label>
            <input
              type="text"
              required
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              type="email"
              required
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Template
            </label>
            <select
              className="w-full p-3 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.templateKey}
              onChange={(e) => {
                const index = e.target.selectedIndex;
                setFormData({
                  ...formData,
                  templateKey: e.target.value,
                  templateNome: e.target.options[index].text,
                });
              }}
            >
              <option value="TEMPLATE_ID_1">Reinf</option>
              <option value="TEMPLATE_ID_2">Pagina qualquer</option>
              <option value="TEMPLATE_ID_3">Sem página...</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={signupLoading}
            className={`w-full py-3 rounded-md text-white font-bold transition-colors ${
              signupLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {signupLoading ? 'Processando...' : 'Criar Página com Template'}
          </button>
        </form>

        {signupMessage && (
          <div
            className={`mt-4 p-4 rounded-md text-sm font-semibold ${
              signupMessage.includes('✅')
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {signupMessage}
          </div>
        )}
      </div>

      {/* --- CARTÃO DA ÁREA DO CLIENTE --- */}
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border-t-4 border-green-500">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">
          Área do Cliente
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Digite seu e-mail para consultar seu status e acessar sua página.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Seu e-mail cadastrado"
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-green-500 outline-none"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
          />

          <button
            type="submit"
            disabled={loginLoading}
            className={`w-full py-3 rounded-md text-white font-bold transition-colors ${
              loginLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loginLoading ? 'Buscando...' : 'Acessar Meu Portal'}
          </button>
        </form>

        {/* Mensagem de Erro do Login */}
        {loginError && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md text-sm font-semibold">
            {loginError}
          </div>
        )}

        {/* Informações do Cliente Encontrado */}
        {clientData && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
            <p className="text-lg">
              Olá, <strong>{clientData.nome}</strong>!
            </p>
            <p className="mt-2 text-gray-600">
              Status Atual:{' '}
              <span className="font-bold text-blue-600">
                {clientData.status_notion}
              </span>
            </p>
            <p className="mt-2 text-xs text-gray-400 break-all">
              ID da Página: {clientData.page_id}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
