import { Client } from '@notionhq/client';

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// Helper para buscar o ID da Data Source
export async function getDataSourceId(databaseId: string) {
  const dbInfo: any = await notion.databases.retrieve({
    database_id: databaseId,
  });
  return dbInfo['data_sources'][0]['id'];
}
