import { notion } from '@/src/lib/notion';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { database_id, properties } = await req.json();

    // 💡 A MÁGICA DA FORMATAÇÃO PARA O NOTION:
    // O Notion exige que as propriedades digam o "tipo" delas.
    // Vamos assumir que a 1ª coluna é o "Título" (obrigatório) e as outras são "Texto"
    const formattedProperties: any = {};
    const colunas = Object.keys(properties);

    colunas.forEach((coluna, index) => {
      // Pula colunas vazias
      if (!properties[coluna]) return;

      if (index === 0) {
        // A primeira coluna enviada geralmente é a chave primária (title) no Notion
        formattedProperties[coluna] = {
          title: [
            {
              text: { content: properties[coluna] },
            },
          ],
        };
      } else {
        // As demais vamos cadastrar como rich_text (texto simples)
        formattedProperties[coluna] = {
          rich_text: [
            {
              text: { content: properties[coluna] },
            },
          ],
        };
      }
    });

    const response = await notion.pages.create({
      parent: { database_id: database_id },
      properties: formattedProperties,
    });

    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    console.error('Erro ao adicionar linha:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
