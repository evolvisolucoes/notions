import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { database_id } = await request.json();
    const token = process.env.NOTION_TOKEN!;

    if (!database_id) {
      return NextResponse.json(
        { error: 'database_id não fornecido' },
        { status: 400 },
      );
    }

    // Busca os dados diretamente na API do Notion
    const response = await fetch(
      `https://api.notion.com/v1/databases/${database_id}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Erro ao buscar a database' },
        { status: response.status },
      );
    }

    // Abstração das Linhas e Colunas
    const rows = data.results.map((page: any) => {
      const props = page.properties || {};
      const rowData: any = {};

      // Mapeia as propriedades dinamicamente
      for (const [propName, propData] of Object.entries<any>(props)) {
        const propType = propData.type;
        let val = '';

        if (propType === 'title' && propData.title) {
          val = propData.title.map((t: any) => t.plain_text).join('');
        } else if (propType === 'rich_text' && propData.rich_text) {
          val = propData.rich_text.map((t: any) => t.plain_text).join('');
        } else if (propType === 'select' && propData.select) {
          val = propData.select.name || '';
        } else if (propType === 'status' && propData.status) {
          val = propData.status.name || '';
        } else if (propType === 'date' && propData.date) {
          val = propData.date.start || '';
        } else if (propType === 'number') {
          val = propData.number !== null ? String(propData.number) : '';
        }

        rowData[propName] = val;
      }
      return rowData;
    });

    return NextResponse.json({ rows }, { status: 200 });
  } catch (error: any) {
    console.error('Erro no get-database-content:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
