'use client';

import { useState } from 'react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    templateKey: 'TEMPLATE_ID_1',
    templateNome: 'Reinf',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        setFormData({ ...formData, nome: '', email: '' }); // Limpa campos
      } else {
        setMessage(`❌ Erro: ${data.error}`);
      }
    } catch (err) {
      setMessage('❌ Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-10 flex flex-col items-center">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
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
            disabled={loading}
            className={`w-full py-3 rounded-md text-white font-bold transition-colors ${
              loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Processando...' : 'Criar Página com Template'}
          </button>
        </form>

        {message && (
          <div
            className={`mt-6 p-4 rounded-md text-sm font-semibold ${
              message.includes('✅')
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </main>
  );
}
