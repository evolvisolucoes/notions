import { Client } from '@notionhq/client';
import { NextResponse } from 'next/server';

const notion = new Client({ auth: process.env.NOTION_SECRET });

export async function PATCH(req: Request) {
  try {
    const { block_id, type, data } = await req.json();

    const updatePayload: any = { block_id: block_id };

    if (type === 'to_do') {
      updatePayload.to_do = { checked: data.checked };
    } else {
      return NextResponse.json(
        { error: 'Tipo de bloco não suportado.' },
        { status: 400 },
      );
    }

    const response = await notion.blocks.update(updatePayload);

    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    console.error('Erro ao atualizar bloco:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
