import { notion } from '@/lib/notion';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { nome, email, templateKey, templateNome } = data;

    if (!templateKey) {
      return NextResponse.json(
        { error: 'Nenhum template selecionado.' },
        { status: 400 },
      );
    }

    // Busca o ID do template nas variáveis de ambiente
    const templateId = process.env[templateKey];

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template não configurado.' },
        { status: 500 },
      );
    }

    const novaPagina = await notion.pages.create({
      parent: { database_id: process.env.DATABASE_GESTAO_ID! },
      properties: {
        Nome: { title: [{ text: { content: nome } }] },
        Email: { email: email },
        Status: { status: { name: 'Pendente' } },
        Plano: { select: { name: templateNome } },
      },
    } as any);

    return NextResponse.json(
      {
        message: `Cliente criado com sucesso usando o ${templateNome}!`,
        notion_id: novaPagina.id,
      },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
