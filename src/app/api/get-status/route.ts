import { notion } from '@/src/lib/notion';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const databaseId = process.env.DATABASE_GESTAO_ID!;

    if (!email) {
      return NextResponse.json(
        { error: 'E-mail não fornecido.' },
        { status: 400 },
      );
    }

    // Consulta oficial na Database do Notion filtrando pelo E-mail
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Email',
        email: { equals: email },
      },
    });

    if (response.results.length === 0) {
      return NextResponse.json(
        { error: 'Utilizador não localizado na Gestão.' },
        { status: 404 },
      );
    }

    // Pega o primeiro resultado encontrado
    const cliente: any = response.results[0];

    // Extrai as propriedades de forma segura (caso algum campo esteja vazio)
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
    console.error('Erro na leitura:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
