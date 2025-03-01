export interface Feed {
  id: string;
  title: string;
  desc: string;
  link: string;
  description: string;
  tags: string[];
  unread_count: number;
}

export interface Item {
  id: string;
  feed_id: string;
  title: string;
  content: string;
  description: string;
  link: string;
  guid: string;
  pub_date?: string;
  image: string;
  read: boolean;
  starred: boolean;
  liked: boolean;
}
