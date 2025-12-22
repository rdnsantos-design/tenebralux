export interface CardBackgroundImage {
  id: string;
  file_name: string;
  file_path: string;
  file_url: string;
  width: number;
  height: number;
  file_size: number;
  uploaded_at: string;
  tags: string[];
  description: string | null;
}

export const REQUIRED_WIDTH = 750;
export const REQUIRED_HEIGHT = 1050;
