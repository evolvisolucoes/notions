import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const databaseId = process.env.DATABASE_GESTAO_ID!;
    const token = process.env.NOTION_TOKEN!;

    if (!email) {
      return NextResponse.json(
        { error: 'E-mail não fornecido.' },
        { status: 400 },
      );
    }

    // Consulta direta na API do Notion via Fetch
    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': '2022-06-28', // Versão oficial da API
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            property: 'Email',
            email: { equals: email },
          },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Erro interno do Notion' },
        { status: response.status },
      );
    }

    if (!data.results || data.results.length === 0) {
      return NextResponse.json(
        { error: 'Utilizador não localizado na Gestão.' },
        { status: 404 },
      );
    }

    const cliente = data.results[0];

    const nome = cliente.properties.Nome?.title[0]?.text?.content || 'Sem Nome';
    const statusAtual = cliente.properties.Status?.status?.name || 'Sem Status';

    return NextResponse.json(
      {
        nome: nome,
        status_notion: statusAtual,
        page_id: cliente.id,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Erro na leitura (Fetch API):', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
