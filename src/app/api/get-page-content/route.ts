import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { page_id } = await request.json();
    const token = process.env.NOTION_TOKEN!;

    if (!page_id) {
      return NextResponse.json(
        { error: 'page_id não fornecido' },
        { status: 400 },
      );
    }

    // Busca os blocos filhos (conteúdo) da página
    const response = await fetch(
      `https://api.notion.com/v1/blocks/${page_id}/children?page_size=100`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Erro ao buscar blocos' },
        { status: response.status },
      );
    }

    // Abstração dos dados: Limpando o JSON sujo do Notion
    const clean_blocks = data.results.map((block: any) => {
      const b_type = block.type;
      const block_data = block[b_type] || {};

      let content_text = '';
      let url = '';
      let checked = false;

      // Extrai textos (presente na maioria dos blocos)
      if (block_data.rich_text) {
        content_text = block_data.rich_text
          .map((t: any) => t.plain_text)
          .join('');
      }

      // Extrai estado de Checkboxes (To-Do)
      if (b_type === 'to_do') {
        checked = block_data.checked || false;
      }

      // Extrai URLs para Mídias e Arquivos
      if (['image', 'video', 'file', 'pdf'].includes(b_type)) {
        if (block_data.external) {
          url = block_data.external.url || '';
        } else if (block_data.file) {
          url = block_data.file.url || '';
        }
      }

      // Extrai títulos de sub-páginas e bancos de dados
      if (['child_page', 'child_database'].includes(b_type)) {
        content_text = block_data.title || `Link para ${b_type}`;
      }

      return {
        id: block.id,
        type: b_type,
        content: content_text,
        url: url,
        checked: checked,
      };
    });

    return NextResponse.json({ blocks: clean_blocks }, { status: 200 });
  } catch (error: any) {
    console.error('Erro no get-page-content:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
